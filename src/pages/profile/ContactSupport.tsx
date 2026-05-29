import { Headphones, Mail, Phone, User } from 'lucide-react'
import PageHeader from '@/components/shared/PageHeader'
import BottomNav from '@/components/shared/BottomNav'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { SUPPORT_CONTACT } from '@/lib/supportContact'

export default function ContactSupport() {
  const { user } = useAuth()
  const role = user?.role ?? 'mr'

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Contact Support" showBack />

      <div className="max-w-md md:max-w-xl lg:max-w-2xl mx-auto space-y-4 px-4 md:px-6 pt-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          For portal issues, DCR help, or account questions, reach out to our support contact below.
        </p>

        <div className="glass-card !rounded-xl divide-y divide-border/50">
          <div className="flex items-center gap-3 px-4 py-3">
            <User className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Name</p>
              <p className="text-sm font-semibold text-foreground">{SUPPORT_CONTACT.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3">
            <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Mobile</p>
              <a
                href={`tel:${SUPPORT_CONTACT.phoneTel}`}
                className="text-sm font-semibold text-primary hover:underline"
              >
                {SUPPORT_CONTACT.phone}
              </a>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3">
            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Email</p>
              <a
                href={`mailto:${SUPPORT_CONTACT.email}`}
                className="text-sm font-semibold text-primary hover:underline break-all"
              >
                {SUPPORT_CONTACT.email}
              </a>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Button asChild className="w-full rounded-xl h-11 gap-2">
            <a href={`tel:${SUPPORT_CONTACT.phoneTel}`}>
              <Phone className="h-4 w-4" />
              Call {SUPPORT_CONTACT.name}
            </a>
          </Button>
          <Button asChild variant="outline" className="w-full rounded-xl h-11 gap-2">
            <a href={`mailto:${SUPPORT_CONTACT.email}?subject=MakTree%20Portal%20Support`}>
              <Mail className="h-4 w-4" />
              Send email
            </a>
          </Button>
        </div>

        <div className="glass-card !rounded-xl p-3.5 flex gap-3">
          <Headphones className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Include your name, role (MR/Manager), and a short description of the issue. For urgent DCR
            deadlines, call instead of email.
          </p>
        </div>
      </div>

      <BottomNav role={role} />
    </div>
  )
}
