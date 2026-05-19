/** Polling + focus refresh for time-critical status (TP, DCR today, pending requests). */
export const LIVE_QUERY_OPTIONS = {
  staleTime: 15_000,
  refetchInterval: 30_000,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
} as const

/** Dashboard stats / team lists: fresh on focus + realtime invalidation, no 30s poll storm. */
export const DASHBOARD_QUERY_OPTIONS = {
  staleTime: 30_000,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
} as const
