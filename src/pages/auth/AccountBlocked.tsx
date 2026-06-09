import { useNavigate } from 'react-router-dom'
import { ShieldX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import MaktreeBrand from '@/components/shared/MaktreeBrand'
import { COMPANY_ACCOUNT_BLOCKED_MESSAGE } from '@/lib/accountAccess'

export default function AccountBlocked() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-5">
      <div className="w-full max-w-sm md:max-w-md text-center space-y-6 animate-fade-in-up">
        <MaktreeBrand variant="login" />
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-5 py-6 space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <ShieldX className="h-7 w-7 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-lg font-bold text-foreground">Access denied</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">{COMPANY_ACCOUNT_BLOCKED_MESSAGE}</p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full rounded-xl"
          onClick={() => navigate('/login', { replace: true })}
        >
          Back to login
        </Button>
      </div>
    </div>
  )
}
