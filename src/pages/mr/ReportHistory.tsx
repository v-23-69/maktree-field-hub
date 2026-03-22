import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/shared/PageHeader';
import BottomNav from '@/components/shared/BottomNav';
import EmptyState from '@/components/shared/EmptyState';
import { MOCK_REPORTS } from '@/lib/mock-data';
import { CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ReportHistory() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="Report History" showBack />

      <div className="px-4 py-4 space-y-3">
        {MOCK_REPORTS.length === 0 ? (
          <EmptyState message="No reports yet. Start your first daily report today!" />
        ) : (
          MOCK_REPORTS.map((report, i) => (
            <button
              key={report.id}
              onClick={() => {}}
              className="w-full rounded-xl bg-card p-4 shadow-sm text-left active:scale-[0.98] transition-transform animate-fade-in-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">
                    {new Date(report.report_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">3 doctors visited</p>
                </div>
                <span className={cn(
                  'flex items-center gap-1 text-xs font-medium rounded-full px-2.5 py-1',
                  report.status === 'submitted' ? 'bg-primary/10 text-primary' : 'bg-accent/20 text-accent-foreground'
                )}>
                  {report.status === 'submitted' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                  {report.status === 'submitted' ? 'Submitted' : 'Draft'}
                </span>
              </div>
            </button>
          ))
        )}
      </div>

      <BottomNav role="mr" />
    </div>
  );
}
