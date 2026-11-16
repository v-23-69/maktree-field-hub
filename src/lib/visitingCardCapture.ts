import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { isNativeApp } from '@/lib/capacitor'
import type { CapturedCardImage, VisitingCardSide } from '@/lib/visitingCard'

function isUserCancel(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error ?? '')
  return /cancel|cancelled|canceled|no image|user denied/i.test(msg)
}

function stripDataUrl(raw: string): string {
  const trimmed = raw.trim()
  const comma = trimmed.indexOf(',')
  if (trimmed.startsWith('data:') && comma !== -1) return trimmed.slice(comma + 1)
  return trimmed
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(stripDataUrl(String(reader.result ?? '')))
    reader.onerror = () => reject(new Error('Could not read the photo.'))
    reader.readAsDataURL(blob)
  })
}

export async function captureVisitingCardPhoto(
  kind: 'camera' | 'upload',
  side: VisitingCardSide = 'front',
): Promise<CapturedCardImage | null> {
  if (!isNativeApp()) {
    throw new Error('Visiting-card capture is available in the Android app only.')
  }

  try {
    try {
      const perms = await Camera.requestPermissions({ permissions: ['camera', 'photos'] })
      if (kind === 'camera' && perms.camera === 'denied') {
        throw new Error('Camera permission is required to scan a visiting card.')
      }
      if (kind === 'upload' && perms.photos === 'denied') {
        throw new Error('Gallery permission is required to upload a visiting card.')
      }
    } catch (error) {
      if (error instanceof Error && /permission/i.test(error.message)) throw error
      /* Some Android WebViews skip the plugin permission helper; Camera.getPhoto still prompts. */
    }

    const photo = await Camera.getPhoto({
      quality: 70,
      width: 1400,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: kind === 'camera' ? CameraSource.Camera : CameraSource.Photos,
      correctOrientation: true,
    })

    let base64 = photo.dataUrl ? stripDataUrl(photo.dataUrl) : (photo.base64String ?? '').trim()
    if (!base64 && photo.webPath) {
      const res = await fetch(photo.webPath)
      base64 = await blobToBase64(await res.blob())
    }
    if (!base64) {
      throw new Error('The photo could not be read. Try again, a little closer to the card.')
    }

    return {
      side,
      mime: photo.format === 'png' ? 'image/png' : 'image/jpeg',
      base64,
    }
  } catch (error) {
    if (isUserCancel(error)) return null
    throw error
  }
}
