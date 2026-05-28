/**
 * Apple-style activity rings (kokonutui-inspired).
 * @see https://kokonutui.com
 */

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface ActivityRingData {
  label: string
  /** Fill percentage 0–100 */
  value: number
  color: string
  size: number
  /** Optional caption under label in legend mode */
  hint?: string
}

interface CircleProgressProps {
  data: ActivityRingData
  index: number
  strokeWidth?: number
}

function lightenRingColor(color: string): string {
  if (color === '#FF2D55') return '#FF6B8B'
  if (color === '#A3F900') return '#C5FF4D'
  if (color === '#04C7DD') return '#4DDFED'
  if (color === '#10B981') return '#34D399'
  if (color === '#3B82F6') return '#60A5FA'
  if (color === '#F59E0B') return '#FBBF24'
  return color
}

const CircleProgress = ({ data, index, strokeWidth = 12 }: CircleProgressProps) => {
  const radius = (data.size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const clamped = Math.max(0, Math.min(100, data.value))
  const progress = ((100 - clamped) / 100) * circumference
  const gradientId = `ring-gradient-${data.label.replace(/\s+/g, '-').toLowerCase()}-${index}`
  const gradientUrl = `url(#${gradientId})`

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: index * 0.12, ease: 'easeOut' }}
    >
      <svg
        width={data.size}
        height={data.size}
        viewBox={`0 0 ${data.size} ${data.size}`}
        className="transform -rotate-90"
        aria-label={`${data.label} — ${clamped}%`}
      >
        <title>{`${data.label} — ${clamped}%`}</title>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={data.color} stopOpacity={1} />
            <stop offset="100%" stopColor={lightenRingColor(data.color)} stopOpacity={1} />
          </linearGradient>
        </defs>
        <circle
          cx={data.size / 2}
          cy={data.size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-zinc-200/60 dark:text-zinc-800/60"
        />
        <motion.circle
          cx={data.size / 2}
          cy={data.size / 2}
          r={radius}
          fill="none"
          stroke={gradientUrl}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: progress }}
          transition={{ duration: 1.2, delay: index * 0.12, ease: 'easeInOut' }}
          strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.12))' }}
        />
      </svg>
    </motion.div>
  )
}

type AppleActivityRingsProps = {
  activities: ActivityRingData[]
  className?: string
  /** Outer box size (width & height) — rings are centered inside */
  containerSize?: number
  strokeWidth?: number
}

/** Stacked concentric activity rings only (embed in dashboards). */
export function AppleActivityRings({
  activities,
  className,
  containerSize = 112,
  strokeWidth = 11,
}: AppleActivityRingsProps) {
  if (activities.length === 0) return null

  return (
    <div
      className={cn('relative shrink-0', className)}
      style={{ width: containerSize, height: containerSize }}
    >
      {activities.map((activity, index) => (
        <CircleProgress
          key={`${activity.label}-${index}`}
          data={activity}
          index={index}
          strokeWidth={strokeWidth}
        />
      ))}
    </div>
  )
}

type AppleActivityCardProps = {
  title?: string
  activities?: ActivityRingData[]
  className?: string
  showLegend?: boolean
}

const DEMO_ACTIVITIES: ActivityRingData[] = [
  { label: 'MOVE', value: 85, color: '#FF2D55', size: 200, hint: '479/800 CAL' },
  { label: 'EXERCISE', value: 60, color: '#A3F900', size: 160, hint: '24/30 MIN' },
  { label: 'STAND', value: 30, color: '#04C7DD', size: 120, hint: '6/12 HR' },
]

/** Full card with title + rings + legend (demo / standalone). */
export function AppleActivityCard({
  title = 'Activity Rings',
  activities = DEMO_ACTIVITIES,
  className,
  showLegend = true,
}: AppleActivityCardProps) {
  const maxSize = Math.max(...activities.map(a => a.size), 120)

  return (
    <div
      className={cn(
        'relative w-full max-w-3xl mx-auto p-6 rounded-3xl text-zinc-900 dark:text-white',
        className,
      )}
    >
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-center">
        {title ? (
          <motion.h2
            className="text-xl font-medium text-zinc-900 dark:text-white sm:hidden text-center"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {title}
          </motion.h2>
        ) : null}

        <AppleActivityRings
          activities={activities}
          containerSize={maxSize}
          strokeWidth={14}
        />

        {showLegend && (
          <motion.div
            className="flex flex-col gap-4 sm:ml-6"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            {title ? (
              <h2 className="hidden sm:block text-xl font-medium text-zinc-900 dark:text-white">
                {title}
              </h2>
            ) : null}
            {activities.map(activity => (
              <div key={activity.label} className="flex flex-col">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  {activity.label}
                </span>
                <span className="text-lg font-semibold" style={{ color: activity.color }}>
                  {activity.hint ?? `${activity.value}%`}
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}
