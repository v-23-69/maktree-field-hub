import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import type { SpecialityChartRow } from '@/components/charts/chartTypes'

const DEFAULT_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6']

export type SpecialityPieChartProps = {
  data: SpecialityChartRow[]
  heightPx?: number
  outerRadius?: number
  showSliceLabels?: boolean
  legendFontSize?: number
  colors?: string[]
}

export default function SpecialityPieChart({
  data,
  heightPx = 200,
  outerRadius = 70,
  showSliceLabels = false,
  legendFontSize = 11,
  colors = DEFAULT_COLORS,
}: SpecialityPieChartProps) {
  return (
    <div className="w-full" style={{ height: heightPx }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="visits"
            nameKey="speciality"
            cx="50%"
            cy="50%"
            outerRadius={outerRadius}
            label={
              showSliceLabels
                ? ({ speciality, visits }: SpecialityChartRow) => `${speciality}: ${visits}`
                : undefined
            }
          >
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: legendFontSize }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
