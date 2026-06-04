import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { LIVE_QUERY_OPTIONS } from '@/lib/liveQueryOptions'
import { invalidateDashboardQueries } from '@/lib/invalidateDashboardQueries'
import { loadReportVisits } from '@/hooks/useReport'
import type { ReportVisit } from '@/types/database.types'

export type PendingDcrImport = {
  import_id: string
  mr_report_id: string
  mr_id: string
  mr_name: string
  report_date: string
  visit_count: number
  mr_submitted_at: string | null
}

export type DcrImportDetail = PendingDcrImport & {
  visits: ReportVisit[]
}

export type ExtraVisitPayload = {
  doctor_id: string
  doctor_sub_area_id: string
  products_promoted: string[]
  chemist_name: string
  competitors: { brand_name: string; quantity: number }[]
  monthly_support: { product_id: string; quantity: number }[]
}

export function usePendingDcrImports(managerId: string) {
  return useQuery({
    queryKey: ['pending-dcr-imports', managerId],
    ...LIVE_QUERY_OPTIONS,
    enabled: !!managerId && !!supabase,
    queryFn: async (): Promise<PendingDcrImport[]> => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase.rpc('list_pending_dcr_imports_for_manager')
      if (error) throw error
      return (data ?? []) as PendingDcrImport[]
    },
  })
}

export function useDcrImportDetail(importId: string) {
  return useQuery({
    queryKey: ['dcr-import-detail', importId],
    enabled: !!importId && !!supabase,
    queryFn: async (): Promise<DcrImportDetail | null> => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data: rows, error } = await supabase
        .from('dcr_manager_imports')
        .select(`
          id,
          mr_report_id,
          mr_id,
          report_date,
          status,
          mr:users!dcr_manager_imports_mr_id_fkey(full_name)
        `)
        .eq('id', importId)
        .eq('status', 'pending')
        .maybeSingle()
      if (error) throw error
      if (!rows) return null

      const row = rows as {
        id: string
        mr_report_id: string
        mr_id: string
        report_date: string
        status: string
        mr: { full_name: string | null } | null
      }

      const visits = await loadReportVisits(supabase, row.mr_report_id)
      const { data: mrReport } = await supabase
        .from('daily_reports')
        .select('submitted_at')
        .eq('id', row.mr_report_id)
        .maybeSingle()

      return {
        import_id: row.id,
        mr_report_id: row.mr_report_id,
        mr_id: row.mr_id,
        mr_name: row.mr?.full_name?.trim() || 'MR',
        report_date: row.report_date,
        visit_count: visits.length,
        mr_submitted_at: (mrReport?.submitted_at as string | null) ?? null,
        visits,
      }
    },
  })
}

export function useCompleteDcrImport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (p: {
      importId: string
      includedVisitIds: string[]
      extraVisits: ExtraVisitPayload[]
    }) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase.rpc('complete_dcr_manager_import', {
        p_import_id: p.importId,
        p_included_source_visit_ids: p.includedVisitIds,
        p_extra_visits: p.extraVisits,
      })
      if (error) {
        const msg =
          (error as { message?: string }).message ??
          (error as { details?: string }).details ??
          'Import failed'
        throw new Error(msg)
      }
      return data as string
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-dcr-imports'] })
      queryClient.invalidateQueries({ queryKey: ['dcr-import-detail'] })
      queryClient.invalidateQueries({ queryKey: ['mr-reports'] })
      queryClient.invalidateQueries({ queryKey: ['allowed-report-dates'] })
      invalidateDashboardQueries(queryClient)
    },
  })
}

export function useDismissDcrImport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (importId: string) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { error } = await supabase.rpc('dismiss_dcr_manager_import', {
        p_import_id: importId,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-dcr-imports'] })
      queryClient.invalidateQueries({ queryKey: ['dcr-import-detail'] })
    },
  })
}
