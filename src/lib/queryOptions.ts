/** Profile query: cache longer to avoid repeat fetches on dashboard + popup. */
export const PROFILE_QUERY_OPTIONS = {
  staleTime: 5 * 60_000,
  gcTime: 15 * 60_000,
  refetchOnWindowFocus: false,
} as const
