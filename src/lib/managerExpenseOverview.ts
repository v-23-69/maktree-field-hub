import { monthDateRangeForSql } from '@/lib/dateUtils'
import { supabase } from '@/lib/supabase'

export type ExpenseOverviewTotals = { allotted: number; used: number }
export type ExpenseCategoryRow = { name: string; amount: number }

function isPermissionError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  if (error.code === '42501' || error.code === 'PGRST301') return true
  const msg = (error.message ?? '').toLowerCase()
  return msg.includes('permission denied') || msg.includes('forbidden')
}

/** Aggregate team expense for a calendar month (RPC first, then RLS-scoped tables). */
export async function fetchManagerExpenseOverview(
  mrIds: string[],
  monthYmd: string,
): Promise<{ totals: ExpenseOverviewTotals; byCategory: ExpenseCategoryRow[] }> {
  const empty = { totals: { allotted: 0, used: 0 }, byCategory: [] }
  if (!supabase || mrIds.length === 0 || !monthYmd) return empty

  const monthKey = `${monthYmd.slice(0, 7)}-01`

  const { data: rpcData, error: rpcErr } = await supabase.rpc('get_manager_team_expense_overview', {
    p_mr_ids: mrIds,
    p_month: monthKey,
  })

  if (!rpcErr && rpcData && typeof rpcData === 'object') {
    const payload = rpcData as {
      totals?: { allotted?: number; used?: number }
      byCategory?: Array<{ name?: string; amount?: number }>
    }
    return {
      totals: {
        allotted: Number(payload.totals?.allotted ?? 0),
        used: Number(payload.totals?.used ?? 0),
      },
      byCategory: (payload.byCategory ?? []).map(row => ({
        name: String(row.name ?? 'Other'),
        amount: Number(row.amount ?? 0),
      })),
    }
  }

  if (rpcErr && !isPermissionError(rpcErr)) {
    console.warn('get_manager_team_expense_overview', rpcErr.message)
  }

  const { startInclusive, endExclusive } = monthDateRangeForSql(monthYmd.slice(0, 7))

  const { data: reports, error: repErr } = await supabase
    .from('expense_reports')
    .select('id, mr_id, daily_limit, total_used')
    .in('mr_id', mrIds)
    .gte('report_date', startInclusive)
    .lt('report_date', endExclusive)

  if (repErr) {
    if (isPermissionError(repErr)) return empty
    throw repErr
  }

  const list = reports ?? []
  const totals = list.reduce(
    (acc, r) => {
      acc.allotted += Number(r.daily_limit ?? 0)
      acc.used += Number(r.total_used ?? 0)
      return acc
    },
    { allotted: 0, used: 0 },
  )

  const reportIds = list.map(r => r.id)
  const categoryMap = new Map<string, number>()

  if (reportIds.length > 0) {
    const chunkSize = 40
    for (let i = 0; i < reportIds.length; i += chunkSize) {
      const chunk = reportIds.slice(i, i + chunkSize)
      const { data: items, error: itErr } = await supabase
        .from('expense_items')
        .select('category, amount')
        .in('expense_report_id', chunk)

      if (itErr) {
        if (isPermissionError(itErr)) break
        throw itErr
      }
      for (const it of items ?? []) {
        const key = String(it.category ?? 'Other')
        categoryMap.set(key, (categoryMap.get(key) ?? 0) + Number(it.amount ?? 0))
      }
    }
  }

  return {
    totals,
    byCategory: Array.from(categoryMap.entries()).map(([name, amount]) => ({ name, amount })),
  }
}
