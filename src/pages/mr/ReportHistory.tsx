import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/shared/PageHeader';
import BottomNav from '@/components/shared/BottomNav';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import { useMrReportsWithVisitCounts } from '@/hooks/useReport';
import { CheckCircle2, Clock, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDisplayDate } from '@/lib/dateUtils';

export default function ReportHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: reports = [], isLoading, isError } = useMrReportsWithVisitCounts(user?.id ?? '');

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="Report History" showBack />

      <div className="px-4 py-4 space-y-3">
        {isLoading && <LoadingSpinner />}
        {isError && (
          <p className="text-sm text-destructive text-center py-6">Could not load report history</p>
        )}
        {!isLoading && !isError && reports.length === 0 && (
          <EmptyState message="No reports yet. Start your first daily report today!" />
        )}
        {!isLoading && !isError && reports.map((report, i) => (
          <button
            key={report.id}
            type="button"
            onClick={() => navigate(`/mr/report/${report.id}`)}
            className="w-full rounded-xl bg-card p-4 shadow-sm text-left active:scale-[0.98] transition-transform animate-fade-in-up flex items-center gap-3"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground">
                {formatDisplayDate(report.report_date)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {report.visit_count} doctor visit{report.visit_count === 1 ? '' : 's'}
              </p>
            </div>
            <span className={cn(
              'flex items-center gap-1 text-xs font-medium rounded-full px-2.5 py-1 shrink-0',
              report.status === 'submitted'
                ? 'bg-emerald-600/15 text-emerald-800'
                : 'bg-amber-500/15 text-amber-900',
            )}>
              {report.status === 'submitted' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
              {report.status === 'submitted' ? 'Submitted' : 'Draft'}
            </span>
            <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
          </button>
        ))}
      </div>

      <BottomNav role="mr" />
    </div>
  );
}
