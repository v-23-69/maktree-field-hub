import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '@/components/shared/PageHeader';
import BottomNav from '@/components/shared/BottomNav';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { useManagerMrs } from '@/hooks/useManagerTeam';
import {
  fetchSubmittedReportsWithVisitsForMrInDateRange,
  useManagerMrReportDates,
  useManagerReportByMrAndDate,
} from '@/hooks/useReport';
import { useManagerReportIssues, useUpdateReportIssue } from '@/hooks/useReportIssues';
import { useAllAreas } from '@/hooks/useAreas';
import type { ReportVisit } from '@/types/database.types';
import { Download, ChevronDown, Pill, MapPin, CalendarRange } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDisplayDate, lastDayOfMonthYyyyMmDd, monthDateRangeForSql } from '@/lib/dateUtils';
import { saveDcrReportsPdf } from '@/lib/dcrPdf';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useManagerExpenses } from '@/hooks/useManagerExpense';

function toDateInput(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

type SummaryRow = {
  id: string;
  mr_id: string;
  report_date: string;
  status: string;
};

export default function ManagerReports() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [selectedMr, setSelectedMr] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [includeSelf, setIncludeSelf] = useState(true);
  const [openCards, setOpenCards] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'reports' | 'issues' | 'expenses'>('reports');
  const [filterSpeciality, setFilterSpeciality] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [filterAreaId, setFilterAreaId] = useState('');
  const [filterSubAreaId, setFilterSubAreaId] = useState('');
  const [reportPeriodMode, setReportPeriodMode] = useState<'daily' | 'month'>('daily');
  const [reportMonth, setReportMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [visitSort, setVisitSort] = useState<'doctor' | 'area' | 'speciality'>('doctor');
  const [pdfRangeFrom, setPdfRangeFrom] = useState('');
  const [pdfRangeTo, setPdfRangeTo] = useState('');
  const today = useMemo(() => toDateInput(new Date()), []);
  const weekStart = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = (day + 6) % 7;
    const start = new Date(now);
    start.setDate(now.getDate() - diff);
    return toDateInput(start);
  }, []);
  const monthStart = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  }, []);

  const { data: mrs = [], isLoading: mrsLoading, isError: mrsError } = useManagerMrs(user?.id ?? '');
  const reportUsers = useMemo(() => {
    const base = [...mrs]
    if (includeSelf && user) {
      const exists = base.some(u => u.id === user.id)
      if (!exists) base.unshift({ ...user } as any)
    }
    return base
  }, [mrs, includeSelf, user])
  const { data: allAreas = [] } = useAllAreas();
  const { data: availableDates = [] } = useManagerMrReportDates(selectedMr);
  const { data: report, isLoading: reportLoading, isError: reportError } = useManagerReportByMrAndDate(
    showReport ? selectedMr : '',
    showReport ? selectedDate : '',
  );

  const { data: reportIssues = [], isLoading: issuesLoading, isError: issuesError } =
    useManagerReportIssues(user?.id ?? '');
  const currentMonth = selectedDate ? selectedDate.slice(0, 7) : new Date().toISOString().slice(0, 7)
  const { data: expenseRows = [] } = useManagerExpenses(
    user?.id ?? '',
    currentMonth,
    activeTab === 'expenses',
  )
  const updateIssue = useUpdateReportIssue();
  const selectedMrIds = useMemo(() => {
    const ids = reportUsers.map(u => u.id);
    if (selectedMr) return ids.includes(selectedMr) ? [selectedMr] : [];
    return ids;
  }, [reportUsers, selectedMr]);

  const { data: summaryRows = [] } = useQuery<SummaryRow[]>({
    queryKey: ['manager-report-summary', selectedMrIds, includeSelf, user?.id],
    enabled: !!supabase && selectedMrIds.length > 0,
    queryFn: async () => {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('daily_reports')
        .select('id, mr_id, report_date, status')
        .in('mr_id', selectedMrIds)
        .eq('status', 'submitted');
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: monthReportSummaries = [], isLoading: monthListLoading } = useQuery({
    queryKey: ['manager-mr-submitted-in-month', selectedMr, reportMonth],
    enabled:
      !!supabase &&
      !!selectedMr &&
      activeTab === 'reports' &&
      reportPeriodMode === 'month',
    queryFn: async () => {
      if (!supabase) return [];
      const { startInclusive, endExclusive } = monthDateRangeForSql(reportMonth);
      const { data, error } = await supabase
        .from('daily_reports')
        .select('id, report_date')
        .eq('mr_id', selectedMr)
        .eq('status', 'submitted')
        .gte('report_date', startInclusive)
        .lt('report_date', endExclusive)
        .order('report_date', { ascending: false });
      if (error) throw error;
      return (data ?? []) as { id: string; report_date: string }[];
    },
  });

  const [managerNotesByIssueId, setManagerNotesByIssueId] = useState<Record<string, string>>({});

  useEffect(() => {
    const mrParam = searchParams.get('mrId')
    const dateParam = searchParams.get('date')
    const viewParam = searchParams.get('view')
    if (mrParam && mrParam !== selectedMr) setSelectedMr(mrParam)
    if (dateParam && dateParam !== selectedDate) setSelectedDate(dateParam)
    if (viewParam === '1' && mrParam && dateParam) setShowReport(true)
    // one-time sync from URL
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!reportIssues) return
    setManagerNotesByIssueId(prev => {
      const next = { ...prev }
      let changed = false
      for (const issue of reportIssues) {
        const existing = next[issue.id]
        if (typeof existing === 'string') continue
        next[issue.id] = (issue.manager_note ?? '') as string
        changed = true
      }
      return changed ? next : prev
    })
  }, [reportIssues])

  useEffect(() => {
    if (!selectedMr) return
    if (availableDates.length === 0) return
    if (selectedDate && availableDates.includes(selectedDate)) return
    setSelectedDate(availableDates[0])
    setShowReport(false)
  }, [selectedMr, availableDates, selectedDate])

  const mrUser = useMemo(() => reportUsers.find(u => u.id === selectedMr), [reportUsers, selectedMr]);

  const visits: ReportVisit[] = report?.visits ?? [];
  const sortedVisits = useMemo(() => {
    const copy = [...visits];
    if (visitSort === 'doctor') {
      copy.sort((a, b) =>
        (a.doctor?.full_name ?? '').localeCompare(b.doctor?.full_name ?? '', undefined, {
          sensitivity: 'base',
        }),
      );
    } else if (visitSort === 'area') {
      copy.sort((a, b) =>
        (a.doctor?.sub_area?.name ?? '').localeCompare(b.doctor?.sub_area?.name ?? '', undefined, {
          sensitivity: 'base',
        }),
      );
    } else {
      copy.sort((a, b) =>
        (a.doctor?.speciality ?? '').localeCompare(b.doctor?.speciality ?? '', undefined, {
          sensitivity: 'base',
        }),
      );
    }
    return copy;
  }, [visits, visitSort]);

  const areaNameBySubAreaId = useMemo(() => {
    const map = new Map<string, string>()
    for (const area of allAreas) {
      for (const sa of area.sub_areas ?? []) {
        map.set(sa.id, area.id)
      }
    }
    return map
  }, [allAreas])

  const uniqueSpecialities = useMemo(() => {
    const set = new Set<string>()
    for (const v of sortedVisits) {
      const s = v.doctor?.speciality?.trim()
      if (s) set.add(s)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [sortedVisits])

  const uniqueProducts = useMemo(() => {
    const set = new Set<string>()
    for (const v of sortedVisits) {
      for (const p of v.promoted_products ?? []) {
        const name = p.product?.name?.trim()
        if (name) set.add(name)
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [sortedVisits])

  const filteredVisits = useMemo(() => {
    return sortedVisits.filter(v => {
      if (filterSpeciality) {
        const s = v.doctor?.speciality ?? '';
        if (s !== filterSpeciality) return false;
      }

      if (filterProduct) {
        const has = (v.promoted_products ?? []).some(
          p => (p.product?.name ?? '') === filterProduct,
        );
        if (!has) return false;
      }

      const subAreaId = v.doctor?.sub_area_id ?? '';
      if (filterSubAreaId && subAreaId !== filterSubAreaId) return false;

      if (filterAreaId) {
        const areaId = areaNameBySubAreaId.get(subAreaId) ?? '';
        if (areaId !== filterAreaId) return false;
      }

      return true;
    });
  }, [sortedVisits, filterSpeciality, filterProduct, filterSubAreaId, filterAreaId, areaNameBySubAreaId]);

  const summaryStats = useMemo(() => {
    const isInRange = (date: string, from: string, to: string) => date >= from && date <= to;
    const teamDaily = summaryRows.filter(r => r.report_date === today).length;
    const teamWeekly = summaryRows.filter(r => isInRange(r.report_date, weekStart, today)).length;
    const teamMonthly = summaryRows.filter(r => isInRange(r.report_date, monthStart, today)).length;

    const selfDaily = summaryRows.filter(r => r.mr_id === user?.id && r.report_date === today).length;
    const selfWeekly = summaryRows.filter(r => r.mr_id === user?.id && isInRange(r.report_date, weekStart, today)).length;
    const selfMonthly = summaryRows.filter(r => r.mr_id === user?.id && isInRange(r.report_date, monthStart, today)).length;

    const selectedDaily = selectedMr
      ? summaryRows.filter(r => r.mr_id === selectedMr && r.report_date === today).length
      : teamDaily;
    const selectedWeekly = selectedMr
      ? summaryRows.filter(r => r.mr_id === selectedMr && isInRange(r.report_date, weekStart, today)).length
      : teamWeekly;
    const selectedMonthly = selectedMr
      ? summaryRows.filter(r => r.mr_id === selectedMr && isInRange(r.report_date, monthStart, today)).length
      : teamMonthly;

    return {
      teamDaily,
      teamWeekly,
      teamMonthly,
      selfDaily,
      selfWeekly,
      selfMonthly,
      selectedDaily,
      selectedWeekly,
      selectedMonthly,
    };
  }, [summaryRows, today, weekStart, monthStart, user?.id, selectedMr]);

  const toggleCard = (id: string) => setOpenCards(prev => ({ ...prev, [id]: !prev[id] }));

  const handleViewReport = () => {
    setReportPeriodMode('daily');
    setShowReport(true);
    setOpenCards({});
  };

  const downloadCurrentReportPdf = () => {
    if (!report) {
      toast.error('Load a report first.');
      return;
    }
    const mrName = mrUser?.full_name ?? 'MR';
    const isLeave = (report.report_kind ?? 'field') === 'leave';
    saveDcrReportsPdf([{ ...report, visits: filteredVisits }], {
      fileName: `${isLeave ? 'Leave_DCR' : 'DCR'}_${mrName.replace(/\s+/g, '_')}_${selectedDate}.pdf`,
      documentTitle: isLeave ? 'Leave DCR' : 'Daily Call Report (DCR)',
    });
    toast.success('PDF downloaded');
  };

  const downloadMonthPdf = async () => {
    if (!supabase || !selectedMr) {
      toast.error('Select an MR first.');
      return;
    }
    try {
      const from = `${reportMonth}-01`;
      const to = lastDayOfMonthYyyyMmDd(reportMonth);
      const rows = await fetchSubmittedReportsWithVisitsForMrInDateRange(supabase, selectedMr, from, to);
      if (rows.length === 0) {
        toast.error('No submitted DCRs for that month.');
        return;
      }
      const mrName = mrUser?.full_name ?? 'MR';
      saveDcrReportsPdf(rows, {
        fileName: `DCR_${mrName.replace(/\s+/g, '_')}_${reportMonth}.pdf`,
        documentTitle: `Daily Call Reports — ${reportMonth}`,
      });
      toast.success('PDF downloaded');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Download failed');
    }
  };

  const downloadRangePdf = async () => {
    if (!supabase || !selectedMr) {
      toast.error('Select an MR first.');
      return;
    }
    if (!pdfRangeFrom || !pdfRangeTo || pdfRangeFrom > pdfRangeTo) {
      toast.error('Choose a valid From and To date range.');
      return;
    }
    try {
      const rows = await fetchSubmittedReportsWithVisitsForMrInDateRange(
        supabase,
        selectedMr,
        pdfRangeFrom,
        pdfRangeTo,
      );
      if (rows.length === 0) {
        toast.error('No submitted DCRs in that range.');
        return;
      }
      const mrName = mrUser?.full_name ?? 'MR';
      saveDcrReportsPdf(rows, {
        fileName: `DCR_${mrName.replace(/\s+/g, '_')}_${pdfRangeFrom}_to_${pdfRangeTo}.pdf`,
        documentTitle: `Daily Call Reports — ${pdfRangeFrom} to ${pdfRangeTo}`,
      });
      toast.success('PDF downloaded');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Download failed');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="MR Reports" />

      <div className="px-4 md:px-6 py-4 space-y-4 max-w-2xl lg:max-w-5xl mx-auto">
        <div className="flex gap-2">
          <Button
            type="button"
            variant={activeTab === 'reports' ? 'default' : 'outline'}
            className="flex-1 touch-target rounded-lg"
            onClick={() => {
              setActiveTab('reports')
              setShowReport(false)
              setOpenCards({})
            }}
          >
            Reports
          </Button>
          <Button
            type="button"
            variant={activeTab === 'issues' ? 'default' : 'outline'}
            className="flex-1 touch-target rounded-lg"
            onClick={() => {
              setActiveTab('issues')
              setShowReport(false)
              setOpenCards({})
            }}
          >
            Issues
          </Button>
          <Button
            type="button"
            variant={activeTab === 'expenses' ? 'default' : 'outline'}
            className="flex-1 touch-target rounded-lg"
            onClick={() => setActiveTab('expenses')}
          >
            Expenses
          </Button>
        </div>

        {activeTab === 'reports' && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground">This month (submitted DCRs):</span>{' '}
            You {summaryStats.selfMonthly} ·{' '}
            {selectedMr ? `Selected MR ${summaryStats.selectedMonthly}` : 'Pick an MR'} · Team{' '}
            {summaryStats.teamMonthly}
          </p>

          <div className="rounded-xl border bg-card p-4 shadow-sm space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Medical representative</Label>
              {mrsLoading ? (
                <LoadingSpinner />
              ) : (
                <select
                  value={selectedMr}
                  onChange={e => {
                    setSelectedMr(e.target.value);
                    setShowReport(false);
                  }}
                  className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm touch-target"
                >
                  <option value="">Choose MR</option>
                  {reportUsers.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} ({m.employee_code})
                    </option>
                  ))}
                </select>
              )}
              {mrsError && <p className="text-xs text-destructive">Could not load MR list</p>}
              {!mrsLoading && !mrsError && mrs.length === 0 && (
                <p className="text-xs text-muted-foreground">No MRs assigned to you yet.</p>
              )}
            </div>

            <label className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs">
              <input
                type="checkbox"
                checked={includeSelf}
                onChange={e => setIncludeSelf(e.target.checked)}
              />
              Include yourself in the MR list
            </label>

            <div className="flex rounded-xl border border-border p-1 bg-muted/40">
              <Button
                type="button"
                variant={reportPeriodMode === 'daily' ? 'default' : 'ghost'}
                className="flex-1 rounded-lg touch-target"
                onClick={() => {
                  setReportPeriodMode('daily');
                }}
              >
                Daily DCR
              </Button>
              <Button
                type="button"
                variant={reportPeriodMode === 'month' ? 'default' : 'ghost'}
                className="flex-1 rounded-lg touch-target"
                onClick={() => {
                  setReportPeriodMode('month');
                  setShowReport(false);
                  if (selectedDate) setReportMonth(selectedDate.slice(0, 7));
                }}
              >
                Month view
              </Button>
            </div>

            {reportPeriodMode === 'daily' && (
              <div className="space-y-2">
                <Label className="text-xs">Report date</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={e => {
                    setSelectedDate(e.target.value);
                    setShowReport(false);
                  }}
                  className="touch-target rounded-lg"
                />
                {availableDates.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Most recent submission: {formatDisplayDate(availableDates[0])}
                  </p>
                )}
                <Button
                  onClick={handleViewReport}
                  disabled={!selectedMr || !selectedDate}
                  className="w-full touch-target rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                >
                  Open DCR
                </Button>
              </div>
            )}

            {reportPeriodMode === 'month' && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs">Calendar month</Label>
                  <Input
                    type="month"
                    value={reportMonth}
                    onChange={e => setReportMonth(e.target.value)}
                    className="touch-target rounded-lg"
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full touch-target rounded-lg font-semibold"
                  disabled={!selectedMr}
                  onClick={() => void downloadMonthPdf()}
                >
                  <Download className="h-4 w-4 mr-2 shrink-0" />
                  Download full month (PDF)
                </Button>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Submitted days — tap to open
                  </p>
                  {monthListLoading && <LoadingSpinner />}
                  {!monthListLoading && monthReportSummaries.length === 0 && selectedMr && (
                    <p className="text-xs text-muted-foreground py-2">No submitted DCRs in this month.</p>
                  )}
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {monthReportSummaries.map(row => (
                      <button
                        key={row.id}
                        type="button"
                        className="w-full flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2.5 text-left text-sm hover:bg-muted/50 active:scale-[0.99] transition-transform"
                        onClick={() => {
                          setSelectedDate(row.report_date);
                          setReportPeriodMode('daily');
                          setShowReport(true);
                          setOpenCards({});
                        }}
                      >
                        <span className="font-medium">{formatDisplayDate(row.report_date)}</span>
                        <Badge variant="outline" className="text-[10px]">
                          View
                        </Badge>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="border-t border-border pt-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Custom range (PDF)
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px]">From</Label>
                  <Input
                    type="date"
                    value={pdfRangeFrom}
                    onChange={e => setPdfRangeFrom(e.target.value)}
                    className="h-10 rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">To</Label>
                  <Input
                    type="date"
                    value={pdfRangeTo}
                    onChange={e => setPdfRangeTo(e.target.value)}
                    className="h-10 rounded-lg text-xs"
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full touch-target rounded-lg"
                disabled={!selectedMr}
                onClick={() => void downloadRangePdf()}
              >
                <CalendarRange className="h-4 w-4 mr-2 shrink-0" />
                Download range (PDF)
              </Button>
            </div>
          </div>

          {showReport && reportPeriodMode === 'daily' && selectedMr && selectedDate && (
            <>
              {reportLoading && <LoadingSpinner />}
              {reportError && (
                <p className="text-sm text-destructive text-center py-4">Could not load this report</p>
              )}
              {!reportLoading && !reportError && !report && (
                <EmptyState message="No report found for this MR on the selected date." />
              )}
              {!reportLoading && !reportError && report && (
                <div className="space-y-4 animate-fade-in">
                  <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-lg font-semibold text-foreground">{mrUser?.full_name}</p>
                        <p className="text-xs text-muted-foreground">{mrUser?.employee_code}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            {formatDisplayDate(selectedDate)}
                          </span>
                          {report.manager && (
                            <span>
                              Working with:{' '}
                              {(report.manager as { full_name?: string }).full_name ?? '—'}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 sm:items-end">
                        <Badge className="w-fit bg-primary/10 text-primary border-0 text-xs capitalize">
                          {report.status === 'submitted' ? 'Submitted' : 'Draft'}
                        </Badge>
                        <Button
                          type="button"
                          className="touch-target rounded-lg"
                          onClick={() => downloadCurrentReportPdf()}
                        >
                          <Download className="h-4 w-4 mr-2 shrink-0" />
                          Download this DCR (PDF)
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Filter & sort visits
                      </p>
                      <div className="space-y-1 sm:min-w-[160px]">
                        <Label className="text-[10px]">Sort by</Label>
                        <select
                          value={visitSort}
                          onChange={e =>
                            setVisitSort(e.target.value as 'doctor' | 'area' | 'speciality')
                          }
                          className="flex h-9 w-full rounded-lg border border-input bg-background px-2 text-xs"
                        >
                          <option value="doctor">Doctor name</option>
                          <option value="area">Area</option>
                          <option value="speciality">Speciality</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Speciality</Label>
                        <select
                          value={filterSpeciality}
                          onChange={e => setFilterSpeciality(e.target.value)}
                          className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-xs"
                        >
                          <option value="">All</option>
                          {uniqueSpecialities.map(s => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Product</Label>
                        <select
                          value={filterProduct}
                          onChange={e => setFilterProduct(e.target.value)}
                          className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-xs"
                        >
                          <option value="">All</option>
                          {uniqueProducts.map(p => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Territory</Label>
                        <select
                          value={filterAreaId}
                          onChange={e => {
                            setFilterAreaId(e.target.value);
                            setFilterSubAreaId('');
                          }}
                          className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-xs"
                        >
                          <option value="">All</option>
                          {allAreas.map(a => (
                            <option key={a.id} value={a.id}>
                              {a.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Area</Label>
                        <select
                          value={filterSubAreaId}
                          onChange={e => setFilterSubAreaId(e.target.value)}
                          className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-xs"
                        >
                          <option value="">All</option>
                          {(allAreas
                            .filter(a => !filterAreaId || a.id === filterAreaId)
                            .flatMap(a => a.sub_areas ?? [])
                          ).map(sa => (
                            <option key={sa.id} value={sa.id}>
                              {sa.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto rounded-lg text-xs"
                      onClick={() => {
                        setFilterSpeciality('');
                        setFilterProduct('');
                        setFilterAreaId('');
                        setFilterSubAreaId('');
                      }}
                    >
                      Clear filters
                    </Button>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-foreground mb-3">
                      Doctor visits ({filteredVisits.length})
                    </p>
                    {filteredVisits.length === 0 ? (
                      <EmptyState message="No visits match these filters." />
                    ) : (
                      <div className="space-y-2">
                        {filteredVisits.map(visit => {
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
                            <Collapsible
                              key={cardKey}
                              open={openCards[cardKey] || false}
                              onOpenChange={() => toggleCard(cardKey)}
                            >
                              <CollapsibleTrigger className="w-full">
                                <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 shadow-sm text-left w-full active:scale-[0.98] transition-transform">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm font-semibold text-foreground truncate">
                                        {doc?.full_name ?? 'Doctor'}
                                      </p>
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] px-1.5 py-0 shrink-0"
                                      >
                                        {subName}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      {doc?.speciality ?? ''}
                                    </p>
                                  </div>
                                  <ChevronDown
                                    className={cn(
                                      'h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200',
                                      openCards[cardKey] && 'rotate-180',
                                    )}
                                  />
                                </div>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <div className="mx-1 rounded-b-xl bg-card px-3.5 pb-3.5 space-y-3 border-t border-border">
                                  <div className="flex items-center gap-2 pt-2.5">
                                    <Pill className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">Chemist:</span>
                                    <span className="text-xs font-medium text-foreground">
                                      {chemistName}
                                    </span>
                                  </div>

                                  {products.length > 0 && (
                                    <div>
                                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
                                        Products Promoted
                                      </p>
                                      <div className="flex flex-wrap gap-1">
                                        {products.map(p => (
                                          <Badge
                                            key={p}
                                            className="text-[10px] bg-primary/10 text-primary border-0 hover:bg-primary/10"
                                          >
                                            {p}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {monthly.length > 0 && (
                                    <div>
                                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
                                        Monthly Support
                                      </p>
                                      <div className="rounded-lg border border-border overflow-x-auto max-w-full">
                                        <table className="w-full text-xs min-w-[200px]">
                                          <thead>
                                            <tr className="bg-muted/50">
                                              <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">
                                                Product
                                              </th>
                                              <th className="text-right px-3 py-1.5 font-medium text-muted-foreground">
                                                Qty
                                              </th>
                                              <th className="text-right px-3 py-1.5 font-medium text-muted-foreground">
                                                Amount (Rs)
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {monthly.map((row, i) => {
                                              const saved = Number((row as { amount_inr?: number | null }).amount_inr ?? 0);
                                              const ptr = (row.product as { ptr?: number })?.ptr ?? 0;
                                              const fallback = ptr * (row.quantity || 0);
                                              const amount = saved > 0 ? saved : Math.round(fallback * 100) / 100;
                                              return (
                                                <tr
                                                  key={row.id ?? i}
                                                  className={i % 2 === 1 ? 'bg-muted/30' : ''}
                                                >
                                                  <td className="px-3 py-1.5 text-foreground">
                                                    {row.product?.name ?? '—'}
                                                  </td>
                                                  <td className="px-3 py-1.5 text-right text-foreground">
                                                    {row.quantity}
                                                  </td>
                                                  <td className="px-3 py-1.5 text-right font-semibold text-primary">
                                                    {amount > 0 ? `Rs ${amount.toLocaleString('en-IN')}` : '—'}
                                                  </td>
                                                </tr>
                                              );
                                            })}
                                            {(() => {
                                              const total = monthly.reduce((sum, row) => {
                                                const saved = Number((row as { amount_inr?: number | null }).amount_inr ?? 0);
                                                const ptr = (row.product as { ptr?: number })?.ptr ?? 0;
                                                const fallback = ptr * (row.quantity || 0);
                                                const amount = saved > 0 ? saved : Math.round(fallback * 100) / 100;
                                                return sum + amount;
                                              }, 0);
                                              return total > 0 ? (
                                                <tr className="border-t border-border bg-primary/5">
                                                  <td
                                                    colSpan={2}
                                                    className="px-3 py-1.5 text-right font-semibold text-foreground text-[10px]"
                                                  >
                                                    Total
                                                  </td>
                                                  <td className="px-3 py-1.5 text-right font-bold text-primary">
                                                    Rs {total.toLocaleString('en-IN')}
                                                  </td>
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
                                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
                                        Competitor Survey
                                      </p>
                                      <div className="rounded-lg border border-border overflow-x-auto max-w-full">
                                        <table className="w-full text-xs min-w-[240px]">
                                          <thead>
                                            <tr className="bg-muted/50">
                                              <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">
                                                Brand
                                              </th>
                                              <th className="text-right px-3 py-1.5 font-medium text-muted-foreground">
                                                Qty
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {competitors.map((c, i) => (
                                              <tr
                                                key={c.id ?? i}
                                                className={i % 2 === 1 ? 'bg-muted/30' : ''}
                                              >
                                                <td className="px-3 py-1.5 text-foreground">
                                                  {c.brand_name}
                                                </td>
                                                <td className="px-3 py-1.5 text-right text-foreground">
                                                  {c.quantity}
                                                </td>
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
                </div>
              )}
            </>
          )}

          {!showReport && reportPeriodMode === 'daily' && (
            <EmptyState message="Choose an MR and date, then open the DCR." />
          )}
        </div>
      )}

        {activeTab === 'issues' && (
          <div className="space-y-4 rounded-xl bg-card p-4 shadow-sm animate-fade-in">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Open Report Issues
              </p>
              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                {reportIssues?.length ?? 0}
              </Badge>
            </div>

            {issuesLoading && <LoadingSpinner />}

            {issuesError && <EmptyState message="Could not load report issues." />}

            {!issuesLoading && !issuesError && (reportIssues?.length ?? 0) === 0 && (
              <EmptyState message="No open report issues." />
            )}

            {!issuesLoading && !issuesError && (reportIssues?.length ?? 0) > 0 && (
              <div className="space-y-3">
                {reportIssues.map(issue => {
                  const noteValue =
                    managerNotesByIssueId[issue.id] ?? issue.manager_note ?? ''

                  const canMarkReviewed =
                    issue.status !== 'reviewed' && issue.status !== 'resolved'
                  const canResolve = issue.status !== 'resolved'

                  const statusBadgeClass =
                    issue.status === 'open'
                      ? 'bg-amber-500/10 text-amber-900 border-amber-500/30'
                      : issue.status === 'reviewed'
                        ? 'bg-primary/10 text-primary border-primary/30'
                        : 'bg-emerald-600/10 text-emerald-800 border-emerald-600/30'

                  return (
                    <div
                      key={issue.id}
                      className="rounded-xl border border-border bg-background p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {issue.mr_full_name ?? 'MR'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Date: {issue.report_date ? formatDisplayDate(issue.report_date) : '—'}
                          </p>
                        </div>
                        <Badge className={statusBadgeClass}>{issue.status}</Badge>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Issue
                        </p>
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                          {issue.issue_text}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Manager Note
                        </p>
                        <Textarea
                          value={noteValue}
                          onChange={e =>
                            setManagerNotesByIssueId(prev => ({
                              ...prev,
                              [issue.id]: e.target.value,
                            }))
                          }
                          placeholder="Add your review note…"
                          className="min-h-[120px] touch-target rounded-lg"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          className="flex-1 touch-target rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                          disabled={!canMarkReviewed || updateIssue.isPending}
                          onClick={() =>
                            void updateIssue
                              .mutateAsync({
                                issueId: issue.id,
                                status: 'reviewed',
                                managerNote: noteValue,
                              })
                              .then(() => toast.success('Marked as reviewed'))
                          }
                        >
                          Mark Reviewed
                        </Button>

                        <Button
                          type="button"
                          variant="destructive"
                          className="flex-1 touch-target rounded-lg"
                          disabled={!canResolve || updateIssue.isPending}
                          onClick={() =>
                            void updateIssue
                              .mutateAsync({
                                issueId: issue.id,
                                status: 'resolved',
                                managerNote: noteValue,
                              })
                              .then(() => toast.success('Issue resolved'))
                          }
                        >
                          Resolve
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="rounded-xl bg-card p-4 shadow-sm space-y-3">
            <p className="text-sm font-medium">Expense summary ({expenseRows.length} reports)</p>
            <p className="text-xs text-muted-foreground">
              Showing expense reports you are allowed to view for {currentMonth}. Line items appear under each date.
            </p>
            {expenseRows.length === 0 && (
              <EmptyState message="No expense reports for this month, or none visible with your access." />
            )}
            {expenseRows.map(row => (
              <div key={row.id} className="rounded-lg border border-border p-3 text-sm space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{formatDisplayDate(row.report_date)}</span>
                  <Badge variant="secondary" className="text-xs">
                    Used: {row.total_used}
                  </Badge>
                </div>
                {(row.items ?? []).length === 0 ? (
                  <p className="text-xs text-muted-foreground">No line items.</p>
                ) : (
                  <ul className="text-xs text-muted-foreground space-y-1 border-t border-border pt-2">
                    {row.items.map(it => (
                      <li key={it.id} className="flex justify-between gap-2">
                        <span className="min-w-0 truncate">
                          {it.category}: {it.description}
                        </span>
                        <span className="shrink-0 font-medium text-foreground">{Number(it.amount ?? 0)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav role="manager" />
    </div>
  );
}
