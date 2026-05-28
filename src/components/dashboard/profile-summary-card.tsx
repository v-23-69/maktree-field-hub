import { useEffect, useState } from 'react'
import { Briefcase, MapPin, Phone, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'
import { dashboardPanelClass } from '@/components/dashboard/dashboard-shell'

export type ProfileSummaryStat = {
  label: string
  value: string
}

type Props = {
  name: string
  title?: string
  role?: string
  avatarUrl?: string | null
  initials?: string
  completionPercent: number
  stats?: ProfileSummaryStat[]
  headerAction?: React.ReactNode
  className?: string
}

export default function ProfileSummaryCard({
  name,
  title,
  role,
  avatarUrl,
  initials = '?',
  completionPercent,
  stats = [],
  headerAction,
  className,
}: Props) {
  const [barWidth, setBarWidth] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setBarWidth(Math.min(100, Math.max(0, completionPercent))), 200)
    return () => clearTimeout(t)
  }, [completionPercent])

  return (
    <div className={cn(dashboardPanelClass('overflow-hidden'), className)}>
      <div className="relative h-24 bg-gradient-to-br from-primary/15 via-primary/5 to-background">
        {headerAction && <div className="absolute top-3 right-3">{headerAction}</div>}
      </div>

      <div className="px-5 pb-5 -mt-10">
        <div className="flex items-end gap-4">
          <div className="h-20 w-20 rounded-full border-4 border-card bg-card shadow-md overflow-hidden shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-primary/10 text-lg font-bold text-primary">
                {initials}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 pb-1">
            {role && (
              <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                {role}
              </span>
            )}
          </div>
        </div>

        <h2 className="text-xl font-semibold text-foreground mt-3 tracking-tight">{name}</h2>
        {title && <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{title}</p>}

        <div className="mt-4 mb-5">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Profile completion</span>
            <span className="font-semibold text-foreground tabular-nums">{Math.round(completionPercent)}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
              style={{ width: `${barWidth}%` }}
            />
          </div>
        </div>

        {stats.length > 0 && (
          <div className="grid grid-cols-2 gap-2.5 border-t border-border pt-4">
            {stats.map(stat => (
              <div key={stat.label} className="rounded-xl bg-muted/40 px-3 py-2.5 min-w-0">
                <p className="text-[10px] text-muted-foreground font-medium">{stat.label}</p>
                <p className="text-sm font-semibold text-foreground truncate">{stat.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function profileStatFromContact(profile: {
  mobile?: string | null
  email?: string | null
  city?: string | null
  state?: string | null
  designation?: string | null
  joining_date?: string | null
}): ProfileSummaryStat[] {
  const rows: ProfileSummaryStat[] = []
  if (profile.mobile) rows.push({ label: 'Mobile', value: profile.mobile })
  if (profile.email) rows.push({ label: 'Email', value: profile.email })
  const loc = [profile.city, profile.state].filter(Boolean).join(', ')
  if (loc) rows.push({ label: 'Location', value: loc })
  if (profile.designation) rows.push({ label: 'Role', value: profile.designation })
  if (profile.joining_date) {
    rows.push({
      label: 'Joined',
      value: new Date(profile.joining_date).toLocaleDateString(undefined, {
        month: 'short',
        year: 'numeric',
      }),
    })
  }
  if ('dob' in profile && profile.dob) {
    rows.push({
      label: 'Birthday',
      value: new Date(profile.dob).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
      }),
    })
  }
  return rows.slice(0, 4)
}

export const ProfileStatIcons = { Phone, Mail, MapPin, Briefcase }
