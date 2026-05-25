import { useNavigate } from 'react-router-dom'
import { Download, ChevronRight } from 'lucide-react'
import { formatDisplayDate } from '@/lib/dateUtils'
import { usePendingDcrImports } from '@/hooks/useDcrImport'

type Props = {
  managerId: string
}

export default function ManagerDcrImportStrip({ managerId }: Props) {
  const navigate = useNavigate()
  const { data: imports = [], isLoading } = usePendingDcrImports(managerId)

  if (isLoading || imports.length === 0) return null

  return (
    <div className="rounded-2xl border border-violet-500/35 bg-violet-500/8 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-violet-500/20 flex items-center gap-2">
        <Download className="h-4 w-4 text-violet-600 dark:text-violet-400 shrink-0" />
        <span className="text-xs font-semibold text-foreground">Import DCR from team MR</span>
      </div>
      <div className="divide-y divide-violet-500/15">
        {imports.map(item => (
          <button
            key={item.import_id}
            type="button"
            onClick={() => navigate(`/manager/dcr-import/${item.import_id}`)}
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-violet-500/5 active:scale-[0.99] transition-all"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{item.mr_name}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {formatDisplayDate(item.report_date)} · {item.visit_count} call{item.visit_count !== 1 ? 's' : ''} to review
              </p>
            </div>
            <span className="shrink-0 text-[10px] font-semibold text-violet-600 dark:text-violet-400 bg-violet-500/10 px-2 py-1 rounded-lg">
              Import
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </button>
        ))}
      </div>
    </div>
  )
}
