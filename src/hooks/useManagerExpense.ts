import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import * as XLSX from 'xlsx'

export function useManagerExpenses(managerId: string, month: string) {
  return useQuery({
    queryKey: ['manager-expenses', managerId, month],
    enabled: !!managerId && !!month && !!supabase,
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data: mrs, error: mrErr } = await supabase.rpc('list_mrs_for_manager')
      if (mrErr) throw mrErr
      const mrIds = (mrs ?? []).map((m: { id: string }) => m.id)
      if (mrIds.length === 0) return []
      const { data, error } = await supabase
        .from('expense_reports')
        .select('*, items:expense_items(*)')
        .in('mr_id', mrIds)
        .gte('report_date', `${month}-01`)
        .lt('report_date', `${month}-32`)
      if (error) throw error
      return data ?? []
    },
  })
}

export function useDownloadExpenseExcel() {
  return (rows: Array<{ Date: string; Category: string; Description: string; Amount: number }>, fileName: string) => {
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Expenses')
    XLSX.writeFile(wb, fileName)
  }
}
