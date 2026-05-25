/** Recharts tooltip styling aligned with theme popover (no recharts import). */
export const analyticsTooltipContent = {
  contentStyle: {
    backgroundColor: 'hsl(var(--popover))',
    color: 'hsl(var(--popover-foreground))',
    border: '1px solid hsl(var(--border))',
    borderRadius: 8,
    fontSize: 12,
    padding: '8px 12px',
    boxShadow: '0 6px 20px rgb(0 0 0 / 0.14)',
  },
  labelStyle: {
    color: 'hsl(var(--popover-foreground))',
    fontWeight: 600,
    marginBottom: 4,
  },
  itemStyle: { color: 'hsl(var(--popover-foreground))' },
  wrapperStyle: { outline: 'none', zIndex: 50 },
} as const

export const barTooltipCursor = { fill: 'hsl(var(--muted) / 0.35)' }
