import { useEffect, useMemo, useState } from 'react';
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
import { useManagerMrs } from '@/hooks/useManagerTeam';
import { useManagerReportByMrAndDate } from '@/hooks/useReport';
import { useManagerReportIssues, useUpdateReportIssue } from '@/hooks/useReportIssues';
import { useAllAreas } from '@/hooks/useAreas';
import type { ReportVisit } from '@/types/database.types';
import { Download, FileSpreadsheet, ChevronDown, Pill, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDisplayDate } from '@/lib/dateUtils';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';

export default function ManagerReports() {
  const { user } = useAuth();
  const [selectedMr, setSelectedMr] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [openCards, setOpenCards] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'reports' | 'issues'>('reports');
  const [filterSpeciality, setFilterSpeciality] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [filterAreaId, setFilterAreaId] = useState('');
  const [filterSubAreaId, setFilterSubAreaId] = useState('');
  const [filterMrId, setFilterMrId] = useState('');
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');

  const { data: mrs = [], isLoading: mrsLoading, isError: mrsError } = useManagerMrs(user?.id ?? '');
  const { data: allAreas = [] } = useAllAreas();
  const { data: report, isLoading: reportLoading, isError: reportError } = useManagerReportByMrAndDate(
    showReport ? selectedMr : '',
    showReport ? selectedDate : '',
  );

  const { data: reportIssues = [], isLoading: issuesLoading, isError: issuesError } =
    useManagerReportIssues(user?.id ?? '');
  const updateIssue = useUpdateReportIssue();

  const [managerNotesByIssueId, setManagerNotesByIssueId] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!reportIssues) return
    setManagerNotesByIssueId(prev => {
      const next = { ...prev }
      for (const issue of reportIssues) {
        const existing = next[issue.id]
        if (typeof existing === 'string') continue
        next[issue.id] = (issue.manager_note ?? '') as string
      }
      return next
    })
  }, [reportIssues])

  const mrUser = useMemo(() => mrs.find(u => u.id === selectedMr), [mrs, selectedMr]);

  const visits: ReportVisit[] = report?.visits ?? [];
  const sortedVisits = useMemo(
    () => [...visits].sort((a, b) => {
      const na = a.doctor?.full_name ?? '';
      const nb = b.doctor?.full_name ?? '';
      return na.localeCompare(nb);
    }),
    [visits],
  );

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
      if (filterMrId && selectedMr !== filterMrId) return false

      if (filterFromDate && selectedDate < filterFromDate) return false
      if (filterToDate && selectedDate > filterToDate) return false

      if (filterSpeciality) {
        const s = v.doctor?.speciality ?? ''
        if (s !== filterSpeciality) return false
      }

      if (filterProduct) {
        const has = (v.promoted_products ?? []).some(
          p => (p.product?.name ?? '') === filterProduct,
        )
        if (!has) return false
      }

      const subAreaId = v.doctor?.sub_area_id ?? ''
      if (filterSubAreaId && subAreaId !== filterSubAreaId) return false

      if (filterAreaId) {
        const areaId = areaNameBySubAreaId.get(subAreaId) ?? ''
        if (areaId !== filterAreaId) return false
      }

      return true
    })
  }, [
    sortedVisits,
    filterMrId,
    selectedMr,
    filterFromDate,
    filterToDate,
    selectedDate,
    filterSpeciality,
    filterProduct,
    filterSubAreaId,
    filterAreaId,
    areaNameBySubAreaId,
  ])

  const toggleCard = (id: string) => setOpenCards(prev => ({ ...prev, [id]: !prev[id] }));

  const handleViewReport = () => {
    setShowReport(true);
    setOpenCards({});
  };

  const downloadCurrentReportExcel = () => {
    if (!report) {
      toast.error('Load a report first.')
      return
    }
    const rows = (report.visits ?? []).map(visit => ({
      'Doctor Name': visit.doctor?.full_name ?? '',
      Speciality: visit.doctor?.speciality ?? '',
      'Sub Area': visit.doctor?.sub_area?.name ?? '',
      Area: (visit.doctor?.sub_area as any)?.area?.name ?? '',
      Chemist: visit.chemist?.name ?? '',
      'Products Promoted': (visit.promoted_products ?? [])
        .map(p => p.product?.name)
        .filter(Boolean)
        .join(', '),
      Competitors: (visit.competitor_entries ?? [])
        .map(c => `${c.brand_name} (${c.quantity})`)
        .join(', '),
      'Monthly Support': (visit.monthly_support_entries ?? [])
        .map(m => `${m.product?.name ?? ''} (${m.quantity})`)
        .join(', '),
    }))

    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Report')
    const mrName = mrUser?.full_name?.replace(/\s+/g, '_') || 'MR'
    XLSX.writeFile(wb, `MR_Report_${mrName}_${selectedDate}.xlsx`)
  }

  const downloadRangeExcel = async () => {
    try {
      if (!supabase) throw new Error('Supabase not configured')
      if (!filterFromDate || !filterToDate) {
        toast.error('Select date range first (From and To).')
        return
      }

      let q = supabase
        .from('v_visit_detail')
        .select('*')
        .gte('report_date', filterFromDate)
        .lte('report_date', filterToDate)

      if (selectedMr) q = q.eq('mr_id', selectedMr)
      if (filterAreaId) {
        const areaName = allAreas.find(a => a.id === filterAreaId)?.name ?? ''
        if (areaName) q = q.eq('area', areaName)
      }
      if (filterSubAreaId) {
        const sa = allAreas.flatMap(a => a.sub_areas ?? []).find(s => s.id === filterSubAreaId)
        if (sa?.name) q = q.eq('sub_area', sa.name)
      }

      const { data, error } = await q.order('report_date', { ascending: false })
      if (error) throw error

      const rows = (data ?? []).map((r: any) => ({
        Date: r.report_date ?? '',
        MR: r.mr_name ?? '',
        'Doctor Name': r.doctor_name ?? '',
        Area: r.area ?? '',
        'Sub Area': r.sub_area ?? '',
        'Doctor Id': r.doctor_id ?? '',
        'Visit Id': r.visit_id ?? '',
      }))

      if (rows.length === 0) {
        toast.error('No visit records found for selected range.')
        return
      }

      const ws = XLSX.utils.json_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Visits')
      XLSX.writeFile(
        wb,
        `MR_Visits_${filterFromDate}_to_${filterToDate}.xlsx`,
      )
      toast.success('Excel downloaded ✓')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Excel download failed')
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="MR Reports" />

      <div className="px-4 py-4 space-y-4">
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
        </div>

        {activeTab === 'reports' && (
        <div className="space-y-3">
        <div className="space-y-3 rounded-xl bg-card p-4 shadow-sm animate-fade-in">
          <div className="space-y-2">
            <Label className="text-xs">Select MR</Label>
            {mrsLoading ? (
              <LoadingSpinner />
            ) : (
              <select
                value={selectedMr}
                onChange={e => { setSelectedMr(e.target.value); setShowReport(false); }}
                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm touch-target"
              >
                <option value="">Choose MR</option>
                {mrs.map(m => <option key={m.id} value={m.id}>{m.full_name} ({m.employee_code})</option>)}
              </select>
            )}
            {mrsError && (
              <p className="text-xs text-destructive">Could not load MR list</p>
            )}
            {!mrsLoading && !mrsError && mrs.length === 0 && (
              <p className="text-xs text-muted-foreground">No MRs assigned to you yet.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Select Date</Label>
            <Input type="date" value={selectedDate} onChange={e => { setSelectedDate(e.target.value); setShowReport(false); }} className="touch-target rounded-lg" />
          </div>

          <Button
            onClick={handleViewReport}
            disabled={!selectedMr || !selectedDate}
            className="w-full touch-target rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
          >
            View Report
          </Button>
        </div>

        <div className="rounded-xl bg-card p-4 shadow-sm space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Doctor Visit Filters
          </p>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Speciality</Label>
              <select
                value={filterSpeciality}
                onChange={e => setFilterSpeciality(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-xs"
              >
                <option value="">All</option>
                {uniqueSpecialities.map(s => (
                  <option key={s} value={s}>{s}</option>
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
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Area</Label>
              <select
                value={filterAreaId}
                onChange={e => {
                  setFilterAreaId(e.target.value)
                  setFilterSubAreaId('')
                }}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-xs"
              >
                <option value="">All</option>
                {allAreas.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Sub-area</Label>
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
                  <option key={sa.id} value={sa.id}>{sa.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">MR</Label>
              <select
                value={filterMrId}
                onChange={e => setFilterMrId(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-xs"
              >
                <option value="">All</option>
                {mrs.map(m => (
                  <option key={m.id} value={m.id}>{m.full_name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">From Date</Label>
              <Input type="date" value={filterFromDate} onChange={e => setFilterFromDate(e.target.value)} className="h-10 rounded-lg text-xs" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">To Date</Label>
              <Input type="date" value={filterToDate} onChange={e => setFilterToDate(e.target.value)} className="h-10 rounded-lg text-xs" />
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full touch-target rounded-lg"
            onClick={() => {
              setFilterSpeciality('')
              setFilterProduct('')
              setFilterAreaId('')
              setFilterSubAreaId('')
              setFilterMrId('')
              setFilterFromDate('')
              setFilterToDate('')
            }}
          >
            Clear Filters
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full touch-target rounded-lg border-accent/50 text-accent-foreground"
            onClick={() => void downloadRangeExcel()}
          >
            <FileSpreadsheet className="h-4 w-4 mr-1.5" />
            Download Date Range Excel
          </Button>
        </div>

        {showReport && selectedMr && selectedDate && (
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
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 touch-target rounded-lg text-sm font-semibold border-primary/30 text-primary" type="button">
                    <Download className="h-4 w-4 mr-1.5" /> Download PDF
                  </Button>
                  <Button variant="outline" className="flex-1 touch-target rounded-lg text-sm font-semibold border-accent/50 text-accent-foreground" type="button" onClick={downloadCurrentReportExcel}>
                    <FileSpreadsheet className="h-4 w-4 mr-1.5" /> Download Excel
                  </Button>
                </div>

                <div className="rounded-xl bg-card p-4 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{mrUser?.full_name}</p>
                      <p className="text-xs text-muted-foreground">{mrUser?.employee_code}</p>
                    </div>
                    <Badge className="bg-primary/10 text-primary border-0 hover:bg-primary/10 text-xs capitalize">
                      {report.status === 'submitted' ? 'Submitted' : 'Draft'}
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-1 text-xs text-muted-foreground pt-1 border-t border-border">
                    <span className="flex items-center gap-1 min-w-0">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{formatDisplayDate(selectedDate)}</span>
                    </span>
                    {report.manager && (
                      <span>Working with: {(report.manager as { full_name?: string }).full_name ?? '—'}</span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-foreground mb-3">Doctor Visits ({filteredVisits.length})</p>
                  {filteredVisits.length === 0 ? (
                    <EmptyState message="No visits recorded for this report." />
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

                                {monthly.length > 0 && (
                                  <div>
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">Monthly Support</p>
                                    <div className="rounded-lg border border-border overflow-x-auto max-w-full">
                                      <table className="w-full text-xs min-w-[240px]">
                                        <thead>
                                          <tr className="bg-muted/50">
                                            <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">Product</th>
                                            <th className="text-right px-3 py-1.5 font-medium text-muted-foreground">Qty</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {monthly.map((row, i) => (
                                            <tr key={row.id ?? i} className={i % 2 === 1 ? 'bg-muted/30' : ''}>
                                              <td className="px-3 py-1.5 text-foreground">{row.product?.name ?? '—'}</td>
                                              <td className="px-3 py-1.5 text-right text-foreground">{row.quantity}</td>
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

          {!showReport && (
            <EmptyState message="Select an MR and date to view their report" />
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
                              .then(() => toast.success('Marked as reviewed ✓'))
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
                              .then(() => toast.success('Issue resolved ✓'))
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
      </div>

      <BottomNav role="manager" />
    </div>
  );
}
