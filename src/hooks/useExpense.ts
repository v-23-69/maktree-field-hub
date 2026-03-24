import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ExpenseItem, ExpenseReport } from '@/types/database.types'

export function useExpenseReport(mrId: string, date: string) {
  return useQuery({
    queryKey: ['expense-report', mrId, date],
    enabled: !!mrId && !!date && !!supabase,
    queryFn: async (): Promise<ExpenseReport | null> => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase
        .from('expense_reports')
        .select('*')
        .eq('mr_id', mrId)
        .eq('report_date', date)
        .maybeSingle()
      if (error) throw error
      return (data as ExpenseReport) ?? null
    },
  })
}

export function useGetOrCreateExpenseReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { mrId: string; date: string; dailyLimit?: number }) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data: existing, error: existingErr } = await supabase
        .from('expense_reports')
        .select('*')
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
        .select('*')
        .single()
      if (error) throw error
      return data as ExpenseReport
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['expense-report', vars.mrId, vars.date] })
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
        .select('*')
        .eq('expense_report_id', reportId)
        .order('created_at')
      if (error) throw error
      return (data ?? []) as ExpenseItem[]
    },
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
    onSuccess: (_data, vars) => queryClient.invalidateQueries({ queryKey: ['expense-items', vars.expense_report_id] }),
  })
}

export function useDeleteExpenseItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { id: string }) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { error } = await supabase.from('expense_items').delete().eq('id', payload.id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expense-items'] }),
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expense-report'] }),
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
        .select('*')
        .eq('mr_id', mrId)
        .eq('month', month)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })
}
