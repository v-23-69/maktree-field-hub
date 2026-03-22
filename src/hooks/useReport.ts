import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { DailyReport, ReportVisit, DailyReportFormData } from '@/types/database.types'

export function useDailyReport(reportId: string) {
  return useQuery({
    queryKey: ['daily-report', reportId],
    queryFn: async (): Promise<DailyReport & { visits: ReportVisit[] }> => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase
        .from('daily_reports')
        .select(`
          *,
          mr:users!daily_reports_mr_id_fkey(*),
          manager:users!daily_reports_manager_id_fkey(*),
          visits:report_visits(
            *,
            doctor:doctors(*),
            chemist:chemists(*),
            promoted_products(*, product:products(*)),
            competitor_entries(*),
            monthly_support_entries(*, product:products(*))
          )
        `)
        .eq('id', reportId)
        .single()
      if (error) throw error
      return data as DailyReport & { visits: ReportVisit[] }
    },
    enabled: !!reportId && !!supabase,
  })
}

export function useCreateReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (formData: DailyReportFormData) => {
      if (!supabase) throw new Error('Supabase not configured')
      // TODO: implement full report creation with visits, products, competitors, support
      const { data, error } = await supabase
        .from('daily_reports')
        .insert({
          mr_id: '', // will be set from auth context
          manager_id: formData.manager_id || null,
          report_date: formData.report_date,
          status: 'draft' as const,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mr-reports'] })
    },
  })
}

export function useSubmitReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (reportId: string) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase
        .from('daily_reports')
        .update({ status: 'submitted', submitted_at: new Date().toISOString() })
        .eq('id', reportId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mr-reports'] })
      queryClient.invalidateQueries({ queryKey: ['daily-report'] })
    },
  })
}

export function useMrReports(mrId: string) {
  return useQuery({
    queryKey: ['mr-reports', mrId],
    queryFn: async (): Promise<DailyReport[]> => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('mr_id', mrId)
        .order('report_date', { ascending: false })
      if (error) throw error
      return data as DailyReport[]
    },
    enabled: !!mrId && !!supabase,
  })
}
