import { ChevronDown } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

type Props = {
  title: string
  summary?: string
  defaultOpen?: boolean
  children: React.ReactNode
}

export default function DashboardCollapsibleSection({
  title,
  summary,
  defaultOpen = true,
  children,
}: Props) {
  return (
    <Collapsible defaultOpen={defaultOpen} className="glass-card !rounded-2xl overflow-hidden">
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 px-4 py-3.5 text-left hover:bg-muted/30 transition-colors">
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground">{title}</p>
          {summary && (
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{summary}</p>
          )}
        </div>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform [[data-state=open]_&]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className={cn('px-4 pb-4 pt-0 space-y-3 border-t border-border/50')}>{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}
