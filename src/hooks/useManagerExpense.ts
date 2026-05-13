import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { monthDateRangeForSql } from '@/lib/dateUtils'
import type { ExpenseItem, ExpenseReport } from '@/types/database.types'

export type ExpenseReportWithItems = ExpenseReport & { items: ExpenseItem[] }

function isPermissionError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  if (error.code === '42501') return true
  const msg = (error.message ?? '').toLowerCase()
  return msg.includes('permission denied') || msg.includes('forbidden')
}

/** Load expense reports for the month; RLS limits rows to the current user (MR own, manager team, admin). */
export function useManagerExpenses(managerId: string, month: string, queryEnabled = true) {
  return useQuery({
    queryKey: ['manager-expenses', managerId, month],
    enabled: !!managerId && !!month && !!supabase && queryEnabled,
    queryFn: async (): Promise<ExpenseReportWithItems[]> => {
      if (!supabase) throw new Error('Supabase not configured')
      const { startInclusive, endExclusive } = monthDateRangeForSql(month)

      const { data: reports, error: repErr } = await supabase
        .from('expense_reports')
        .select('*')
        .gte('report_date', startInclusive)
        .lt('report_date', endExclusive)
        .order('report_date', { ascending: false })

      if (repErr) {
        if (isPermissionError(repErr)) return []
        throw repErr
      }

      const list = (reports ?? []) as ExpenseReport[]
      if (list.length === 0) return []

      const reportIds = list.map(r => r.id)
      const allItems: ExpenseItem[] = []
      const chunkSize = 80

      for (let i = 0; i < reportIds.length; i += chunkSize) {
        const chunk = reportIds.slice(i, i + chunkSize)
        const { data: items, error: itErr } = await supabase
          .from('expense_items')
          .select('*')
          .in('expense_report_id', chunk)
          .order('created_at')

        if (itErr) {
          if (isPermissionError(itErr)) break
          throw itErr
        }
        allItems.push(...((items ?? []) as ExpenseItem[]))
      }

      const byReport = new Map<string, ExpenseItem[]>()
      for (const it of allItems) {
        const arr = byReport.get(it.expense_report_id) ?? []
        arr.push(it)
        byReport.set(it.expense_report_id, arr)
      }

      return list.map(r => ({ ...r, items: byReport.get(r.id) ?? [] }))
    },
  })
}
