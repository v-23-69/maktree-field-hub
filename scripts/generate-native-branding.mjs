/**
 * Builds Android launcher + splash sources.
 * Launch splash uses icon.ico — sharp per-density logo (no full-screen upscale).
 * Home-screen icon still uses icon-512-v2.png.
 */
import { mkdir, writeFile, readFile, unlink, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import decodeIco from 'decode-ico'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const assetsDir = path.join(root, 'assets')
const androidResDir = path.join(root, 'android', 'app', 'src', 'main', 'res')
const publicDir = path.join(root, 'public')

const ICON_SIZE = 1024
const LAUNCHER_LOGO_SCALE = 0.9

/** Pixel size of splash_logo.png per density bucket (~160dp on screen). */
const SPLASH_LOGO_DENSITIES = [
  { folder: 'drawable-mdpi', size: 160 },
  { folder: 'drawable-hdpi', size: 240 },
  { folder: 'drawable-xhdpi', size: 320 },
  { folder: 'drawable-xxhdpi', size: 480 },
  { folder: 'drawable-xxxhdpi', size: 640 },
]

const SPLASH_XML = `<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item>
        <shape android:shape="rectangle">
            <solid android:color="#FFFFFF"/>
        </shape>
    </item>
    <item>
        <bitmap
            android:gravity="center"
            android:src="@drawable/splash_logo"/>
    </item>
</layer-list>
`

const SPLASH_ICON_XML = `<?xml version="1.0" encoding="utf-8"?>
<inset xmlns:android="http://schemas.android.com/apk/res/android"
    android:drawable="@drawable/splash_logo"
    android:inset="18%"/>
`

/** Extract largest frame from icon.ico → assets/launch-splash.png */
async function extractLaunchSplashFromIco() {
  const icoPath = path.join(root, 'icon.ico')
  const buf = await readFile(icoPath)
  const images = decodeIco(buf)
  if (!images.length) throw new Error('icon.ico contains no images')

  const best = [...images].sort((a, b) => b.width - a.width)[0]
  const outPath = path.join(assetsDir, 'launch-splash.png')

  await sharp(best.data, {
    raw: { width: best.width, height: best.height, channels: 4 },
  })
    .png()
    .toFile(outPath)

  console.log(`  launch splash source: icon.ico ${best.width}x${best.height}`)
  return outPath
}

async function renderSplashLogo(logoSrc, pixelSize) {
  return sharp(logoSrc)
    .resize(pixelSize, pixelSize, {
      fit: 'inside',
      background: { r: 255, g: 255, b: 255, alpha: 0 },
      kernel: sharp.kernel.lanczos3,
    })
    .png({ compressionLevel: 3 })
    .toBuffer()
}

async function removeLegacySplashPngs() {
  const folders = await readdir(androidResDir, { withFileTypes: true })
  await Promise.all(
    folders.flatMap(entry => {
      if (!entry.isDirectory() || !entry.name.startsWith('drawable')) return []
      const splashPath = path.join(androidResDir, entry.name, 'splash.png')
      return unlink(splashPath).catch(() => undefined)
    }),
  )
}

async function writeSplashDrawables(logoSrc) {
  await removeLegacySplashPngs()

  for (const spec of SPLASH_LOGO_DENSITIES) {
    const png = await renderSplashLogo(logoSrc, spec.size)
    const outDir = path.join(androidResDir, spec.folder)
    await mkdir(outDir, { recursive: true })
    await writeFile(path.join(outDir, 'splash_logo.png'), png)
  }

  const defaultLogo = await renderSplashLogo(logoSrc, 160)
  await mkdir(path.join(androidResDir, 'drawable'), { recursive: true })
  await writeFile(path.join(androidResDir, 'drawable', 'splash_logo.png'), defaultLogo)
  await writeFile(path.join(androidResDir, 'drawable', 'splash.xml'), SPLASH_XML)
  await writeFile(path.join(androidResDir, 'drawable', 'splash_icon.xml'), SPLASH_ICON_XML)

  const capSplashLogo = await renderSplashLogo(logoSrc, 512)
  await writeFile(path.join(assetsDir, 'splash.png'), capSplashLogo)
}

async function main() {
  const splashOnly = process.argv.includes('--splash-only')
  await mkdir(assetsDir, { recursive: true })
  const splashLogoSrc = await extractLaunchSplashFromIco()
  const launcherLogoSrc = path.join(publicDir, 'icons', 'icon-512-v2.png')

  if (splashOnly) {
    await writeSplashDrawables(splashLogoSrc)
    console.log('Android launch splash drawables refreshed from icon.ico')
    return
  }

  const launcherPx = Math.round(ICON_SIZE * LAUNCHER_LOGO_SCALE)
  const launcherLogo = await sharp(launcherLogoSrc)
    .resize(launcherPx, launcherPx, {
      fit: 'inside',
      background: { r: 255, g: 255, b: 255, alpha: 0 },
      kernel: sharp.kernel.lanczos3,
      withoutEnlargement: true,
    })
    .png()
    .toBuffer()

  const iconForeground = await sharp({
    create: {
      width: ICON_SIZE,
      height: ICON_SIZE,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: launcherLogo, gravity: 'centre' }])
    .png()
    .toBuffer()

  const iconBackground = await sharp({
    create: {
      width: ICON_SIZE,
      height: ICON_SIZE,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .png()
    .toBuffer()

  await sharp(iconForeground).toFile(path.join(assetsDir, 'icon-foreground.png'))
  await sharp(iconBackground).toFile(path.join(assetsDir, 'icon-background.png'))
  await sharp(launcherLogo).toFile(path.join(assetsDir, 'icon.png'))

  await writeSplashDrawables(splashLogoSrc)

  console.log('Native branding assets written')
  console.log('  home-screen icon: icon-512-v2')
  console.log('  launch splash: icon.ico (per-density, centered)')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
