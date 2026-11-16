export type DoctorEntrySource = 'manual' | 'camera' | 'upload'

export type VisitingCardSide = 'front' | 'back'

export type VisitingCardImage = {
  url: string
  public_id?: string | null
  side: VisitingCardSide
}

export type ParsedVisitingCardDoctor = {
  full_name: string
  speciality: string
  qualification: string
  hospital_name: string
  address: string
  city: string
  mobile: string
  email: string
}

export type CapturedCardImage = {
  side: VisitingCardSide
  mime: string
  base64: string
}

export type VisitingCardIntake = {
  source: DoctorEntrySource
  images: VisitingCardImage[]
  doctors: ParsedVisitingCardDoctor[]
}

export const ENTRY_SOURCE_LABEL: Record<DoctorEntrySource, string> = {
  manual: 'Manual',
  camera: 'Camera',
  upload: 'Upload',
}

export function isDoctorEntrySource(value: unknown): value is DoctorEntrySource {
  return value === 'manual' || value === 'camera' || value === 'upload'
}

export function entrySourceFromPayload(payload: unknown): DoctorEntrySource {
  if (!payload || typeof payload !== 'object') return 'manual'
  const raw = (payload as { entry_source?: unknown }).entry_source
  return isDoctorEntrySource(raw) ? raw : 'manual'
}

export function cardImagesFromPayload(payload: unknown): VisitingCardImage[] {
  if (!payload || typeof payload !== 'object') return []
  const raw = (payload as { card_images?: unknown }).card_images
  if (!Array.isArray(raw)) return []
  return raw.flatMap(item => {
    if (!item || typeof item !== 'object') return []
    const url = typeof (item as { url?: unknown }).url === 'string' ? (item as { url: string }).url.trim() : ''
    if (!url) return []
    const side = (item as { side?: unknown }).side === 'back' ? 'back' : 'front'
    const publicId =
      typeof (item as { public_id?: unknown }).public_id === 'string'
        ? (item as { public_id: string }).public_id
        : null
    return [{ url, public_id: publicId, side }]
  })
}

export function normalizeIndianMobile(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2)
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1)
  return digits
}

export function composeDoctorAddress(hospitalName: string, address: string): string {
  const hospital = hospitalName.trim()
  const rest = address.trim()
  if (!hospital) return rest
  if (!rest) return hospital
  if (rest.toLowerCase().includes(hospital.toLowerCase())) return rest
  return `${hospital}, ${rest}`
}

export function emptyParsedDoctor(): ParsedVisitingCardDoctor {
  return {
    full_name: '',
    speciality: '',
    qualification: '',
    hospital_name: '',
    address: '',
    city: '',
    mobile: '',
    email: '',
  }
}

export function parsedDoctorFromFields(p: {
  fullName: string
  speciality: string
  qualification: string
  hospitalName: string
  address: string
  city: string
  mobile: string
  email: string
}): ParsedVisitingCardDoctor {
  return {
    full_name: p.fullName.trim(),
    speciality: p.speciality.trim(),
    qualification: p.qualification.trim(),
    hospital_name: p.hospitalName.trim(),
    address: p.address.trim(),
    city: p.city.trim(),
    mobile: p.mobile.trim(),
    email: p.email.trim(),
  }
}
