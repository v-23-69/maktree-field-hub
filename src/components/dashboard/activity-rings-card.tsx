import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { dashboardPanelClass } from '@/components/dashboard/dashboard-shell'

export type ActivityRingItem = {
  id: string
  label: string
  current: number
  target: number
  unit: string
  color: string
  size: number
}

type CircleProps = {
  data: ActivityRingItem
  index: number
}

function CircleProgress({ data, index }: CircleProps) {
  const strokeWidth = 12
  const radius = (data.size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const pct = data.target > 0 ? Math.min(100, Math.round((data.current / data.target) * 100)) : 0
  const progress = ((100 - pct) / 100) * circumference
  const gradientId = `ring-${data.id}`

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: index * 0.12, ease: 'easeOut' }}
    >
      <svg
        width={data.size}
        height={data.size}
        viewBox={`0 0 ${data.size} ${data.size}`}
        className="-rotate-90"
        aria-label={`${data.label} ${pct}%`}
      >
        <circle
          cx={data.size / 2}
          cy={data.size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/60"
        />
        <motion.circle
          cx={data.size / 2}
          cy={data.size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: progress }}
          transition={{ duration: 1.2, delay: index * 0.12, ease: 'easeInOut' }}
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={data.color} />
            <stop offset="100%" stopColor={data.color} stopOpacity={0.65} />
          </linearGradient>
        </defs>
      </svg>
    </motion.div>
  )
}

type Props = {
  title?: string
  subtitle?: string
  rings: ActivityRingItem[]
  className?: string
}

export default function ActivityRingsCard({
  title = 'Today\'s progress',
  subtitle,
  rings,
  className,
}: Props) {
  if (rings.length === 0) return null

  const maxSize = Math.max(...rings.map(r => r.size), 120)

  return (
    <div className={cn(dashboardPanelClass('p-5'), className)}>
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
        <div
          className="relative shrink-0"
          style={{ width: maxSize, height: maxSize }}
        >
          {rings.map((ring, index) => (
            <CircleProgress key={ring.id} data={ring} index={index} />
          ))}
        </div>

        <div className="flex flex-col gap-4 w-full sm:flex-1">
          {rings.map(ring => {
            const pct = ring.target > 0 ? Math.min(100, Math.round((ring.current / ring.target) * 100)) : 0
            return (
              <div key={ring.id} className="flex flex-col">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {ring.label}
                </span>
                <span className="text-lg font-semibold tabular-nums" style={{ color: ring.color }}>
                  {ring.current}/{ring.target}
                  <span className="text-sm ml-1 font-normal text-muted-foreground">{ring.unit}</span>
                </span>
                <span className="text-[10px] text-muted-foreground">{pct}% complete</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
