import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface ManagerAnalyticsCharts {
  productPromotions: { name: string; count: number }[]
  mrVisits: { name: string; visits: number }[]
  competitorBrands: { brand: string; count: number }[]
  totalVisits: number
  uniqueDoctorVisits: number
}

/** Rows from public.v_monthly_support_summary */
interface MonthlySupportSummaryRow {
  mr_id: string
  mr_name: string
  report_date: string
  product_name: string
  quantity: number
}

/** Rows from public.v_competitor_summary */
interface CompetitorSummaryRow {
  mr_id: string
  mr_name: string
  report_date: string
  competitor_brand: string
  quantity: number
}

/** Rows from public.v_visit_detail */
interface VisitDetailRow {
  mr_id: string
  mr_name: string
  mr_code: string
  report_date: string
  visit_id: string
  doctor_id: string
  doctor_name: string
  sub_area: string
  area: string
}

function num(v: unknown): number {
  if (typeof v === 'number' && !Number.isNaN(v)) return v
  if (typeof v === 'string') return parseFloat(v) || 0
  return 0
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : v != null ? String(v) : ''
}

/** Aggregates analytics views for the manager's MR roster and date range. */
export function useManagerAnalytics(
  mrIds: string[],
  fromDate: string,
  toDate: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ['manager-analytics', mrIds, fromDate, toDate],
    queryFn: async (): Promise<ManagerAnalyticsCharts> => {
      if (!supabase) throw new Error('Supabase not configured')
      if (mrIds.length === 0) {
        return {
          productPromotions: [],
          mrVisits: [],
          competitorBrands: [],
          totalVisits: 0,
          uniqueDoctorVisits: 0,
        }
      }

      try {
        const [msRes, compRes, visitRes] = await Promise.all([
          supabase
            .from('v_monthly_support_summary')
            .select(
              'mr_id, mr_name, report_date, product_name, quantity',
            )
            .in('mr_id', mrIds)
            .gte('report_date', fromDate)
            .lte('report_date', toDate),
          supabase
            .from('v_competitor_summary')
            .select(
              'mr_id, mr_name, report_date, competitor_brand, quantity',
            )
            .in('mr_id', mrIds)
            .gte('report_date', fromDate)
            .lte('report_date', toDate),
          supabase
            .from('v_visit_detail')
            .select(
              'mr_id, mr_name, mr_code, report_date, visit_id, doctor_id, doctor_name, sub_area, area',
            )
            .in('mr_id', mrIds)
            .gte('report_date', fromDate)
            .lte('report_date', toDate),
        ])

        if (msRes.error) throw msRes.error
        if (compRes.error) throw compRes.error
        if (visitRes.error) throw visitRes.error

        const msRows = (msRes.data ?? []) as MonthlySupportSummaryRow[]
        const productMap = new Map<string, number>()
        for (const row of msRows) {
          const name = str(row.product_name) || 'Product'
          const qty = num(row.quantity) || 0
          productMap.set(name, (productMap.get(name) ?? 0) + qty)
        }
        const productPromotions = Array.from(productMap.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)

        const compRows = (compRes.data ?? []) as CompetitorSummaryRow[]
        const brandMap = new Map<string, number>()
        for (const row of compRows) {
          const brand = str(row.competitor_brand) || 'Brand'
          const qty = num(row.quantity) || 0
          brandMap.set(brand, (brandMap.get(brand) ?? 0) + qty)
        }
        const competitorBrands = Array.from(brandMap.entries())
          .map(([brand, count]) => ({ brand, count }))
          .sort((a, b) => b.count - a.count)

        const visitRows = (visitRes.data ?? []) as VisitDetailRow[]
        const visitIds = new Set<string>()
        const mrVisitMap = new Map<string, number>()
        for (const row of visitRows) {
          const vid = str(row.visit_id)
          if (vid) visitIds.add(vid)
          const mrName = str(row.mr_name) || str(row.mr_code) || str(row.mr_id)
          const mrKey = mrName || 'MR'
          mrVisitMap.set(mrKey, (mrVisitMap.get(mrKey) ?? 0) + 1)
        }

        const mrVisits = Array.from(mrVisitMap.entries())
          .map(([name, visits]) => ({ name, visits }))
          .sort((a, b) => b.visits - a.visits)

        const totalVisits = visitRows.length
        const uniqueDoctorVisits = visitIds.size || totalVisits

        return {
          productPromotions,
          mrVisits,
          competitorBrands,
          totalVisits,
          uniqueDoctorVisits,
        }
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Failed to load analytics'
        throw new Error(message)
      }
    },
    enabled: enabled && mrIds.length > 0 && !!fromDate && !!toDate && !!supabase,
  })
}
