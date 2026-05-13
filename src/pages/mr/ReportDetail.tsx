import { useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import PageHeader from '@/components/shared/PageHeader';
import BottomNav from '@/components/shared/BottomNav';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Textarea } from '@/components/ui/textarea';
import { useDailyReport } from '@/hooks/useReport';
import type { ReportVisit } from '@/types/database.types';
import { ChevronDown, Pill, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDisplayDate } from '@/lib/dateUtils';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { saveDcrReportsPdf } from '@/lib/dcrPdf';

export default function ReportDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const navRole = location.pathname.startsWith('/manager/') ? 'manager' : 'mr';
  const [openCards, setOpenCards] = useState<Record<string, boolean>>({});
  const { user } = useAuth();
  const [issueDrawerOpen, setIssueDrawerOpen] = useState(false);
  const [issueText, setIssueText] = useState('');
  const [issueSubmitting, setIssueSubmitting] = useState(false);

  const { data: report, isLoading, isError } = useDailyReport(id ?? '');

  const visits: ReportVisit[] = report?.visits ?? [];
  const sortedVisits = useMemo(
    () => [...visits].sort((a, b) => {
      const na = a.doctor?.full_name ?? '';
      const nb = b.doctor?.full_name ?? '';
      return na.localeCompare(nb);
    }),
    [visits],
  );

  const toggleCard = (id: string) => setOpenCards(prev => ({ ...prev, [id]: !prev[id] }));

  const downloadThisReportPdf = () => {
    if (!report) return;
    if (report.mr_id !== user?.id) {
      toast.error('You can only download your own DCR here.');
      return;
    }
    if (report.status !== 'submitted') {
      toast.error('Submit this DCR before downloading as PDF.');
      return;
    }
    const name = user?.full_name?.replace(/\s+/g, '_') ?? 'DCR';
    const isLeave = (report.report_kind ?? 'field') === 'leave';
    saveDcrReportsPdf([{ ...report, visits: sortedVisits }], {
      fileName: `${isLeave ? 'Leave_DCR' : 'DCR'}_${name}_${report.report_date}.pdf`,
      documentTitle: isLeave ? 'Leave DCR' : 'Daily Call Report (DCR)',
    });
    toast.success('PDF downloaded');
  };

  const dateLabel = report?.report_date ? formatDisplayDate(report.report_date) : '';

  if (!id) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <PageHeader title="Report" showBack />
        <EmptyState message="Invalid report." />
        <BottomNav role={navRole} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Daily Report" showBack />

      <div className="px-4 md:px-6 py-4 space-y-4 max-w-2xl lg:max-w-3xl mx-auto">
        {isLoading && <LoadingSpinner />}
        {isError && (
          <p className="text-sm text-destructive text-center py-6">Could not load report</p>
        )}
        {!isLoading && !isError && !report && (
          <EmptyState message="Report not found." />
        )}
        {!isLoading && !isError && report && (
          <>
            <div className="rounded-xl bg-card p-4 shadow-sm space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold text-foreground">{dateLabel}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs text-muted-foreground capitalize">{report.status}</p>
                    {(report.report_kind ?? 'field') === 'leave' && (
                      <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
                        Leave DCR
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:items-end">
                  <Badge
                    className={cn(
                      'rounded-full border-0 text-xs w-fit',
                      report.status === 'submitted'
                        ? 'bg-emerald-600/15 text-emerald-800'
                        : 'bg-amber-500/15 text-amber-900',
                    )}
                  >
                    {report.status === 'submitted' ? 'Submitted' : 'Draft'}
                  </Badge>
                  {report.status === 'submitted' && report.mr_id === user?.id && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-lg touch-target"
                      onClick={() => downloadThisReportPdf()}
                    >
                      <Download className="h-4 w-4 mr-2 shrink-0" />
                      Download PDF
                    </Button>
                  )}
                </div>
              </div>
              {report.manager && (report.report_kind ?? 'field') === 'field' && (
                <p className="text-xs text-muted-foreground pt-1 border-t border-border">
                  Working with: {(report.manager as { full_name?: string }).full_name ?? '—'}
                </p>
              )}
            </div>

            {(report.report_kind ?? 'field') === 'leave' ? (
              <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 space-y-2">
                <p className="text-sm font-semibold text-foreground">Leave DCR</p>
                <p className="text-xs text-muted-foreground">
                  Short attendance record for an approved leave day (no field visits).
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Badge variant="outline" className="text-xs">
                    {(report.leave_dcr_category ?? '') === 'sick' ? 'Sick leave' : 'Casual leave'}
                  </Badge>
                </div>
                {report.leave_dcr_remark?.trim() ? (
                  <p className="text-sm text-foreground whitespace-pre-wrap border-t border-border pt-3 mt-1">
                    {report.leave_dcr_remark.trim()}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground border-t border-border pt-3 mt-1">No remark.</p>
                )}
              </div>
            ) : (
            <div>
              <p className="text-sm font-medium text-foreground mb-3">Doctor Visits ({sortedVisits.length})</p>
              {sortedVisits.length === 0 ? (
                <EmptyState message="No visits on this report." />
              ) : (
                <div className="space-y-2">
                  {sortedVisits.map(visit => {
                    const doc = visit.doctor;
                    const subName = doc?.sub_area?.name ?? '—';
                    const chemistName = visit.chemist?.name ?? '—';
                    const products =
                      (visit.promoted_products ?? [])
                        .map(pp => pp.product?.name)
                        .filter(Boolean) as string[];
                    const competitors = visit.competitor_entries ?? [];
                    const monthly = visit.monthly_support_entries ?? [];
                    const cardKey = visit.id;

                    return (
                      <Collapsible key={cardKey} open={openCards[cardKey] || false} onOpenChange={() => toggleCard(cardKey)}>
                        <CollapsibleTrigger className="w-full">
                          <div className="flex items-center gap-3 rounded-xl bg-card p-3.5 shadow-sm text-left w-full active:scale-[0.98] transition-transform">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-foreground truncate">{doc?.full_name ?? 'Doctor'}</p>
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">{subName}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">{doc?.speciality ?? ''}</p>
                            </div>
                            <ChevronDown className={cn(
                              'h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200',
                              openCards[cardKey] && 'rotate-180'
                            )} />
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="mx-1 rounded-b-xl bg-card px-3.5 pb-3.5 space-y-3 border-t border-border">
                            <div className="flex items-center gap-2 pt-2.5">
                              <Pill className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">Chemist:</span>
                              <span className="text-xs font-medium text-foreground">{chemistName}</span>
                            </div>

                            {products.length > 0 && (
                              <div>
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">Products Promoted</p>
                                <div className="flex flex-wrap gap-1">
                                  {products.map(p => (
                                    <Badge key={p} className="text-[10px] bg-primary/10 text-primary border-0 hover:bg-primary/10">{p}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {monthly.length > 0 && (
                              <div>
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">Monthly Support</p>
                                <div className="rounded-lg border border-border overflow-x-auto max-w-full">
                                  <table className="w-full text-xs min-w-[240px]">
                                    <thead>
                                      <tr className="bg-muted/50">
                                        <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">Product</th>
                                        <th className="text-right px-3 py-1.5 font-medium text-muted-foreground">Qty</th>
                                        <th className="text-right px-3 py-1.5 font-medium text-muted-foreground">PTR</th>
                                        <th className="text-right px-3 py-1.5 font-medium text-muted-foreground">Rupee-wise</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {monthly.map((row, i) => {
                                        const ptr = row.product?.ptr ?? 0;
                                        const rupeeWise = ptr * (row.quantity || 0);
                                        return (
                                          <tr key={row.id ?? i} className={i % 2 === 1 ? 'bg-muted/30' : ''}>
                                            <td className="px-3 py-1.5 text-foreground">{row.product?.name ?? '—'}</td>
                                            <td className="px-3 py-1.5 text-right text-foreground">{row.quantity}</td>
                                            <td className="px-3 py-1.5 text-right text-muted-foreground">{ptr > 0 ? `Rs ${ptr}` : '—'}</td>
                                            <td className="px-3 py-1.5 text-right font-semibold text-primary">{rupeeWise > 0 ? `Rs ${rupeeWise.toLocaleString('en-IN')}` : '—'}</td>
                                          </tr>
                                        );
                                      })}
                                      {(() => {
                                        const total = monthly.reduce((sum, row) => sum + ((row.product?.ptr ?? 0) * (row.quantity || 0)), 0);
                                        return total > 0 ? (
                                          <tr className="border-t border-border bg-primary/5">
                                            <td colSpan={3} className="px-3 py-1.5 text-right font-semibold text-foreground text-[10px]">Total Rupee-wise</td>
                                            <td className="px-3 py-1.5 text-right font-bold text-primary">Rs {total.toLocaleString('en-IN')}</td>
                                          </tr>
                                        ) : null;
                                      })()}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {competitors.length > 0 && (
                              <div>
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">Competitor Survey</p>
                                <div className="rounded-lg border border-border overflow-x-auto max-w-full">
                                  <table className="w-full text-xs min-w-[240px]">
                                    <thead>
                                      <tr className="bg-muted/50">
                                        <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">Brand</th>
                                        <th className="text-right px-3 py-1.5 font-medium text-muted-foreground">Qty</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {competitors.map((c, i) => (
                                        <tr key={c.id ?? i} className={i % 2 === 1 ? 'bg-muted/30' : ''}>
                                          <td className="px-3 py-1.5 text-foreground">{c.brand_name}</td>
                                          <td className="px-3 py-1.5 text-right text-foreground">{c.quantity}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                </div>
              )}
            </div>
            )}

            <Button variant="outline" className="w-full" type="button" onClick={() => navigate(navRole === 'manager' ? '/manager/report/history' : '/mr/report/history')}>
              Back to history
            </Button>

            <div className="pt-3">
              <Button
                type="button"
                variant="secondary"
                className="w-full touch-target rounded-lg"
                onClick={() => setIssueDrawerOpen(true)}
              >
                Report an Issue
              </Button>
            </div>
          </>
        )}
      </div>

      <Drawer
        open={issueDrawerOpen}
        onOpenChange={v => {
          if (!v) setIssueDrawerOpen(false)
        }}
      >
        <DrawerContent className="!mt-0 flex h-[100dvh] max-h-[100dvh] flex-col rounded-t-[10px] border bg-background p-0 gap-0">
          <DrawerHeader className="shrink-0 border-b border-border px-4 pb-3 pt-2">
            <DrawerTitle className="text-base">Report an Issue</DrawerTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Date: {report?.report_date ? formatDisplayDate(report.report_date) : '—'}
            </p>
          </DrawerHeader>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 pt-4 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Issue Description
              </label>
              <Textarea
                value={issueText}
                onChange={e => setIssueText(e.target.value)}
                placeholder="Describe the issue you found in this report…"
                className="min-h-[140px] touch-target rounded-lg"
              />
            </div>

            <Button
              type="button"
              disabled={!issueText.trim() || issueSubmitting || !report || !user || !supabase}
              onClick={async () => {
                if (!report || !user || !supabase) return
                setIssueSubmitting(true)
                try {
                  const { error: insErr } = await supabase
                    .from('report_issues')
                    .insert({
                      report_id: report.id,
                      mr_id: user.id,
                      issue_text: issueText.trim(),
                      report_date: report.report_date,
                    })
                  if (insErr) throw insErr

                  toast.success('Issue submitted')
                  setIssueDrawerOpen(false)
                  setIssueText('')
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : 'Submit failed')
                } finally {
                  setIssueSubmitting(false)
                }
              }}
              className="w-full touch-target rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            >
              {issueSubmitting ? 'Submitting…' : 'Submit'}
            </Button>
          </div>
        </DrawerContent>
      </Drawer>

      <BottomNav role={navRole} />
    </div>
  );
}
