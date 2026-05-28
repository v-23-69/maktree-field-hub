import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ToolbarButton {
  id?: string
  label: string
  icon?: React.ReactNode
  count?: number
  onClick?: () => void
  dropdownItems?: { label: string; onClick?: () => void }[]
  active?: boolean
}

interface ActionToolbarProps {
  buttons: ToolbarButton[]
  compact?: boolean
  className?: string
  /** When set, toolbar is controlled (for dashboard period filters). */
  activeId?: string
  onActiveChange?: (id: string) => void
}

export function ActionToolbar({
  buttons,
  compact = false,
  className = '',
  activeId,
  onActiveChange,
}: ActionToolbarProps) {
  const isControlled = activeId != null && Boolean(onActiveChange)
  const [internalActive, setInternalActive] = useState(
    () => activeId ?? buttons.findIndex(b => b.active)?.toString() ?? '0',
  )

  useEffect(() => {
    if (isControlled && activeId != null) setInternalActive(activeId)
  }, [isControlled, activeId])

  const resolveActive = (index: number, btn: ToolbarButton) => {
    const key = btn.id ?? String(index)
    if (isControlled) return activeId === key
    return internalActive === key || (!!btn.active && internalActive === String(index))
  }

  const setActive = (index: number, btn: ToolbarButton, onClick?: () => void) => {
    const key = btn.id ?? String(index)
    if (isControlled) onActiveChange?.(key)
    else setInternalActive(key)
    onClick?.()
  }

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-1 rounded-2xl border border-border/80 bg-muted/30 p-1 shadow-sm',
        className,
      )}
      role="toolbar"
    >
      {buttons.map((btn, index) => {
        const isActive = resolveActive(index, btn)

        const buttonClasses = cn(
          'flex items-center gap-2 h-9 rounded-xl transition-all duration-200 font-medium',
          isActive
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'hover:bg-background/80 text-muted-foreground hover:text-foreground',
        )

        if (btn.dropdownItems?.length) {
          return (
            <div key={btn.id ?? index} className="flex items-center">
              <Button
                type="button"
                onClick={() => setActive(index, btn, btn.onClick)}
                variant="ghost"
                className={cn(buttonClasses, compact ? 'px-2' : 'px-3')}
              >
                {btn.icon}
                <span className="text-sm">{btn.label}</span>
                {btn.count !== undefined && (
                  <Badge
                    variant={isActive ? 'secondary' : 'outline'}
                    className="text-[10px] font-mono -me-0.5"
                  >
                    {btn.count}
                  </Badge>
                )}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    className="ml-0 h-9 w-8 rounded-xl hover:bg-background/80"
                  >
                    <ChevronDown className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl">
                  {btn.dropdownItems.map((item, i) => (
                    <DropdownMenuItem key={i} onClick={item.onClick}>
                      {item.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        }

        return (
          <Button
            key={btn.id ?? index}
            type="button"
            onClick={() => setActive(index, btn, btn.onClick)}
            variant="ghost"
            className={cn(buttonClasses, compact ? 'px-2' : 'px-3')}
          >
            {btn.icon}
            <span className="text-sm">{btn.label}</span>
            {btn.count !== undefined && (
              <Badge
                variant={isActive ? 'secondary' : 'outline'}
                className="text-[10px] font-mono -me-0.5"
              >
                {btn.count}
              </Badge>
            )}
          </Button>
        )
      })}
    </div>
  )
}
