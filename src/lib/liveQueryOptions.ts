/** Polling + focus refresh for dashboards and pending-request badges. */
export const LIVE_QUERY_OPTIONS = {
  staleTime: 15_000,
  refetchInterval: 30_000,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
} as const
