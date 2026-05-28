import AppLogo from '@/components/shared/AppLogo'
import { cn } from '@/lib/utils'

type MaktreeBrandProps = {
  variant?: 'login' | 'header' | 'compact'
  className?: string
}

export default function MaktreeBrand({ variant = 'header', className }: MaktreeBrandProps) {
  const isLogin = variant === 'login'

  if (isLogin) {
    return (
      <div className={cn('min-w-0 flex flex-col items-center justify-center w-full gap-2', className)}>
        <AppLogo className="h-36 w-36 sm:h-40 sm:w-40 drop-shadow-lg" />
        <p className="font-brand font-semibold text-2xl sm:text-3xl leading-none tracking-[-0.02em] text-center -mt-0.5">
          <span className="text-foreground">Maktree</span>
          <span className="text-primary"> SFA</span>
        </p>
        <p className="text-xs text-muted-foreground">Caring Beyond Drugs</p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'min-w-0 inline-flex items-center gap-1 sm:gap-1.5 py-0.5',
        className,
      )}
    >
      <AppLogo
        className="h-11 w-11 sm:h-12 sm:w-12 shrink-0 drop-shadow-md -mr-0.5"
        alt="MakTree"
      />
      <p className="font-brand font-semibold leading-none tracking-[-0.03em] truncate text-lg sm:text-xl">
        <span className="text-foreground">Maktree</span>
        <span className="text-primary"> SFA</span>
      </p>
    </div>
  )
}
