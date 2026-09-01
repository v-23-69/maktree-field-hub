import { Link } from 'react-router-dom'
import { Globe, Smartphone } from 'lucide-react'
import MaktreeBrand from '@/components/shared/MaktreeBrand'
import { APK_DOWNLOAD_FILENAME, APK_DOWNLOAD_PATH } from '@/lib/apkDownload'

export default function GetStarted() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-5 py-10 w-full max-w-full overflow-x-hidden">
      <div className="w-full max-w-md min-w-0 animate-fade-in-up md:glass-card md:p-8 md:rounded-2xl">
        <div className="mb-8 flex flex-col items-center">
          <MaktreeBrand variant="login" />
        </div>

        <p className="mb-6 text-center text-sm text-muted-foreground">
          Choose how you want to open Maktree SFA
        </p>

        <div className="space-y-3">
          <Link
            to="/login"
            className="flex w-full items-center gap-4 rounded-2xl border-2 border-border/60 bg-card p-4 text-left shadow-sm transition-all hover:border-primary/40 hover:shadow-md active:scale-[0.98]"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Globe className="h-6 w-6" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] font-bold text-foreground">Use on web</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Open in this browser — laptops and temporary use
              </span>
            </span>
          </Link>

          <a
            href={APK_DOWNLOAD_PATH}
            download={APK_DOWNLOAD_FILENAME}
            className="flex w-full items-center gap-4 rounded-2xl border-2 border-primary/30 bg-primary p-4 text-left text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 active:scale-[0.98]"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15">
              <Smartphone className="h-6 w-6" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] font-bold">Download application</span>
              <span className="mt-0.5 block text-xs text-primary-foreground/80">
                Android APK for phones and tablets
              </span>
            </span>
          </a>
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
          After download, open the file and allow install from that app if Android asks.
          Uninstall any old USB/debug Maktree SFA first.
        </p>
      </div>
    </div>
  )
}
