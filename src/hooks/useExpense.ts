import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  EXPENSE_ITEM_COLUMNS,
  EXPENSE_MONTHLY_SUMMARY_COLUMNS,
  EXPENSE_REPORT_COLUMNS,
} from '@/lib/queryColumns'
import { supabase } from '@/lib/supabase'
import { invalidateDashboardQueries } from '@/lib/invalidateDashboardQueries'
import type { ExpenseItem, ExpenseReport } from '@/types/database.types'

async function syncExpenseReportTotalUsed(reportId: string): Promise<void> {
  if (!supabase) return
  const { data: rows, error: sumErr } = await supabase
    .from('expense_items')
    .select('amount')
    .eq('expense_report_id', reportId)
  if (sumErr) throw sumErr
  const total = (rows ?? []).reduce((s, r: { amount: number }) => s + Number(r.amount ?? 0), 0)
  const { error: upErr } = await supabase
    .from('expense_reports')
    .update({ total_used: total })
    .eq('id', reportId)
  if (upErr) throw upErr
}

function isForbidden(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  return error.code === '42501' || /forbidden/i.test(error.message ?? '')
}

export function useExpenseReport(mrId: string, date: string) {
  return useQuery({
    queryKey: ['expense-report', mrId, date],
    enabled: !!mrId && !!date && !!supabase,
    queryFn: async (): Promise<ExpenseReport | null> => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase
        .from('expense_reports')
        .select(EXPENSE_REPORT_COLUMNS)
        .eq('mr_id', mrId)
        .eq('report_date', date)
        .maybeSingle()
      if (error) {
        if (isForbidden(error)) return null
        throw error
      }
      return (data as ExpenseReport) ?? null
    },
    retry: false,
  })
}

export function useGetOrCreateExpenseReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { mrId: string; date: string; dailyLimit?: number }) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data: existing, error: existingErr } = await supabase
        .from('expense_reports')
        .select(EXPENSE_REPORT_COLUMNS)
        .eq('mr_id', payload.mrId)
        .eq('report_date', payload.date)
        .maybeSingle()
      if (existingErr) throw existingErr
      if (existing) return existing as ExpenseReport

      const { data, error } = await supabase
        .from('expense_reports')
        .insert({
          mr_id: payload.mrId,
          report_date: payload.date,
          daily_limit: payload.dailyLimit ?? 300,
          total_used: 0,
          status: 'draft',
        })
        .select(EXPENSE_REPORT_COLUMNS)
        .single()
      if (error?.code === '23505') {
        const { data: retry, error: retryErr } = await supabase
          .from('expense_reports')
          .select(EXPENSE_REPORT_COLUMNS)
          .eq('mr_id', payload.mrId)
          .eq('report_date', payload.date)
          .maybeSingle()
        if (retryErr) throw retryErr
        if (retry) return retry as ExpenseReport
      }
      if (error) throw error
      return data as ExpenseReport
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['expense-report', vars.mrId, vars.date] })
      invalidateDashboardQueries(queryClient)
    },
  })
}

export function useExpenseItems(reportId?: string) {
  return useQuery({
    queryKey: ['expense-items', reportId],
    enabled: !!reportId && !!supabase,
    queryFn: async (): Promise<ExpenseItem[]> => {
      if (!supabase || !reportId) throw new Error('Supabase not configured')
      const { data, error } = await supabase
        .from('expense_items')
        .select(EXPENSE_ITEM_COLUMNS)
        .eq('expense_report_id', reportId)
        .order('created_at')
      if (error) {
        if (isForbidden(error)) return []
        throw error
      }
      return (data ?? []) as ExpenseItem[]
    },
    retry: false,
  })
}

export function useAddExpenseItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Omit<ExpenseItem, 'id' | 'created_at'>) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { error } = await supabase.from('expense_items').insert(payload)
      if (error) throw error
    },
    onSuccess: async (_data, vars) => {
      await syncExpenseReportTotalUsed(vars.expense_report_id)
      queryClient.invalidateQueries({ queryKey: ['expense-items', vars.expense_report_id] })
      queryClient.invalidateQueries({ queryKey: ['expense-report'] })
      queryClient.invalidateQueries({ queryKey: ['dcr-daily-status'] })
      queryClient.invalidateQueries({ queryKey: ['allowed-report-dates'] })
      queryClient.invalidateQueries({ queryKey: ['manager-expenses'] })
      queryClient.invalidateQueries({ queryKey: ['manager-mr-today-expense-status'] })
    },
  })
}

export function useDeleteExpenseItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { id: string; expense_report_id: string }) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { error } = await supabase.from('expense_items').delete().eq('id', payload.id)
      if (error) throw error
    },
    onSuccess: async (_data, vars) => {
      await syncExpenseReportTotalUsed(vars.expense_report_id)
      queryClient.invalidateQueries({ queryKey: ['expense-items', vars.expense_report_id] })
      queryClient.invalidateQueries({ queryKey: ['expense-report'] })
      queryClient.invalidateQueries({ queryKey: ['dcr-daily-status'] })
      queryClient.invalidateQueries({ queryKey: ['allowed-report-dates'] })
      queryClient.invalidateQueries({ queryKey: ['manager-expenses'] })
      queryClient.invalidateQueries({ queryKey: ['manager-mr-today-expense-status'] })
    },
  })
}

export function useSubmitExpenseReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (reportId: string) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { error } = await supabase
        .from('expense_reports')
        .update({ status: 'submitted', submitted_at: new Date().toISOString() })
        .eq('id', reportId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-report'] })
      invalidateDashboardQueries(queryClient)
    },
  })
}

export function useExpenseSummary(mrId: string, month: string) {
  return useQuery({
    queryKey: ['expense-summary', mrId, month],
    enabled: !!mrId && !!month && !!supabase,
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase
        .from('v_expense_monthly_summary')
        .select(EXPENSE_MONTHLY_SUMMARY_COLUMNS)
        .eq('mr_id', mrId)
        .eq('month', month)
        .maybeSingle()
      if (error) {
        if (isForbidden(error)) return null
        throw error
      }
      return data
    },
    retry: false,
  })
}
