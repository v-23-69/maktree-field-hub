/** Light refresh for status that changes after manager actions. Avoid 30s poll storms. */
export const LIVE_QUERY_OPTIONS = {
  staleTime: 60_000,
  refetchInterval: 120_000,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
} as const

/** Dashboard stats / team lists: fresh on focus + realtime invalidation, no 30s poll storm. */
export const DASHBOARD_QUERY_OPTIONS = {
  staleTime: 30_000,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
} as const
