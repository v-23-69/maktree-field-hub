/** Analytics pages: cache longer, no aggressive refetch. */
export const ANALYTICS_QUERY_OPTIONS = {
  staleTime: 3 * 60_000,
  gcTime: 15 * 60_000,
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
} as const
