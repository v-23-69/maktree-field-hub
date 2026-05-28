import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { dashboardPanelClass } from '@/components/dashboard/dashboard-shell'

export interface ChartDataPoint {
  label: string
  currentValue: number
  previousValue: number
}

export interface ActivityStatsCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  icon: React.ReactNode
  mainValue: string
  changeValue: number
  changeDescription: string
  chartData: ChartDataPoint[]
  onActionClick?: () => void
  primaryBarClassName?: string
  secondaryBarClassName?: string
}

function normalizeBarHeight(value: number, max: number) {
  if (max <= 0) return 0
  return Math.max(4, Math.round((value / max) * 100))
}

export const ActivityStatsCard = React.forwardRef<HTMLDivElement, ActivityStatsCardProps>(
  (
    {
      className,
      title,
      icon,
      mainValue,
      changeValue,
      changeDescription,
      chartData,
      onActionClick,
      primaryBarClassName,
      secondaryBarClassName,
      ...props
    },
    ref,
  ) => {
    const ChangeIndicator = changeValue > 0 ? ArrowUpRight : changeValue < 0 ? ArrowDownRight : ArrowRight
    const changeColor =
      changeValue > 0
        ? 'text-emerald-600'
        : changeValue < 0
          ? 'text-red-600'
          : 'text-muted-foreground'

    const maxVal = Math.max(
      1,
      ...chartData.flatMap(p => [p.currentValue, p.previousValue]),
    )

    const containerVariants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { staggerChildren: 0.06, delayChildren: 0.1 },
      },
    }

    const barVariants = {
      hidden: { height: '0%', opacity: 0 },
      visible: (height: number) => ({
        height: `${height}%`,
        opacity: 1,
        transition: { type: 'spring', stiffness: 320, damping: 26 },
      }),
    }

    return (
      <Card
        ref={ref}
        className={cn(dashboardPanelClass('w-full max-w-none overflow-hidden'), className)}
        {...props}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="text-primary shrink-0">{icon}</div>
              <CardTitle className="text-base font-semibold truncate">{title}</CardTitle>
            </div>
            {onActionClick && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 h-9 w-9 rounded-lg"
                onClick={onActionClick}
                aria-label="View details"
              >
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground tabular-nums">
              {mainValue}
            </p>
            <div className={cn('flex items-center gap-1 text-sm mt-1', changeColor)}>
              <ChangeIndicator className="h-4 w-4 shrink-0" />
              <span className="tabular-nums">
                {Math.abs(changeValue)}%{' '}
                <span className="text-muted-foreground font-normal">{changeDescription}</span>
              </span>
            </div>
          </div>

          {chartData.length > 0 ? (
            <div className="h-32 w-full">
              <div className="flex items-center justify-end gap-3 text-[10px] text-muted-foreground mb-2">
                <span className="inline-flex items-center gap-1">
                  <span className={cn('h-2 w-2 rounded-sm bg-primary', primaryBarClassName)} />
                  Current
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className={cn('h-2 w-2 rounded-sm bg-muted', secondaryBarClassName)} />
                  Previous
                </span>
              </div>
              <AnimatePresence>
                <motion.div
                  key={chartData.map(p => p.label).join('-')}
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex h-full w-full items-end justify-between gap-1.5"
                >
                  {chartData.map(point => (
                    <div
                      key={point.label}
                      className="flex h-full flex-1 flex-col items-center justify-end gap-1.5 min-w-0"
                    >
                      <div className="relative flex h-[calc(100%-1.25rem)] w-full items-end justify-center gap-0.5">
                        <motion.div
                          custom={normalizeBarHeight(point.currentValue, maxVal)}
                          variants={barVariants}
                          className={cn(
                            'w-[42%] max-w-[14px] rounded-sm bg-primary',
                            primaryBarClassName,
                          )}
                          role="presentation"
                        />
                        <motion.div
                          custom={normalizeBarHeight(point.previousValue, maxVal)}
                          variants={barVariants}
                          className={cn(
                            'w-[42%] max-w-[14px] rounded-sm bg-muted',
                            secondaryBarClassName,
                          )}
                          role="presentation"
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                        {point.label}
                      </span>
                    </div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground py-6 text-center">No trend data for this period.</p>
          )}
        </CardContent>
      </Card>
    )
  },
)

ActivityStatsCard.displayName = 'ActivityStatsCard'
