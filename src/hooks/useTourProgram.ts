import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { TourProgram, TourProgramEntry } from '@/types/database.types'

export function useTourProgram(mrId: string, month: string) {
  return useQuery({
    queryKey: ['tour-program', mrId, month],
    enabled: !!mrId && !!month && !!supabase,
    queryFn: async (): Promise<TourProgram | null> => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase
        .from('tour_programs')
        .select('*')
        .eq('mr_id', mrId)
        .eq('month', month)
        .maybeSingle()
      if (error) throw error
      return (data as TourProgram) ?? null
    },
  })
}

export function useTourProgramEntries(tourProgramId?: string) {
  return useQuery({
    queryKey: ['tour-program-entries', tourProgramId],
    enabled: !!tourProgramId && !!supabase,
    queryFn: async (): Promise<TourProgramEntry[]> => {
      if (!supabase || !tourProgramId) throw new Error('Supabase not configured')
      const { data, error } = await supabase
        .from('tour_program_entries')
        .select('*')
        .eq('tour_program_id', tourProgramId)
        .order('work_date')
      if (error) throw error
      return (data ?? []) as TourProgramEntry[]
    },
  })
}

export function useCreateOrUpdateTourProgram() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { mr_id: string; month: string; manager_id: string | null }) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase
        .from('tour_programs')
        .upsert(
          { mr_id: payload.mr_id, month: payload.month, manager_id: payload.manager_id, status: 'draft' },
          { onConflict: 'mr_id,month' },
        )
        .select('*')
        .single()
      if (error) throw error
      return data as TourProgram
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tour-program'] }),
  })
}

export function useSaveTourProgramEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Omit<TourProgramEntry, 'id'>) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { error } = await supabase
        .from('tour_program_entries')
        .upsert(payload, { onConflict: 'tour_program_id,work_date' })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tour-program-entries'] }),
  })
}

export function useSubmitTourProgram() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { tourProgramId: string; month: string }) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data: lateData, error: lateErr } = await supabase.rpc('is_tp_submission_late', {
        p_month: payload.month,
      })
      if (lateErr) throw lateErr
      const { error } = await supabase
        .from('tour_programs')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          is_late: !!lateData,
        })
        .eq('id', payload.tourProgramId)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tour-program'] }),
  })
}

export function useCopyPreviousMonth() {
  return useMutation({
    mutationFn: async (_payload: { mrId: string; month: string; tourProgramId: string }) => {
      // Kept as hook API placeholder; implementation depends on business mapping rules in backend.
      return
    },
  })
}

export function useManagerPendingTourPrograms(managerId: string) {
  return useQuery({
    queryKey: ['manager-pending-tour-programs', managerId],
    enabled: !!managerId && !!supabase,
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data: mrs, error: mrErr } = await supabase.rpc('list_mrs_for_manager')
      if (mrErr) throw mrErr
      const mrRows = (mrs ?? []) as Array<{ id: string; full_name?: string | null }>
      const mrIds = mrRows.map(m => m.id)
      if (mrIds.length === 0) return []
      const { data, error } = await supabase
        .from('tour_programs')
        .select('*')
        .eq('status', 'submitted')
        .in('mr_id', mrIds)
        .order('submitted_at', { ascending: false })
      if (error) throw error
      const nameById = new Map(mrRows.map(r => [r.id, r.full_name ?? null]))
      return (data ?? []).map(row => ({
        ...row,
        mr_name: nameById.get((row as { mr_id: string }).mr_id) ?? null,
      }))
    },
  })
}

export function useResolveTourProgram() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { tourProgramId: string; action: 'approved' | 'rejected'; managerNote?: string }) => {
      if (!supabase) throw new Error('Supabase not configured')
      const patch =
        payload.action === 'approved'
          ? { status: 'approved', approved_at: new Date().toISOString(), manager_note: null }
          : { status: 'rejected', manager_note: payload.managerNote ?? null }
      const { error } = await supabase.from('tour_programs').update(patch).eq('id', payload.tourProgramId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-pending-tour-programs'] })
      queryClient.invalidateQueries({ queryKey: ['tour-program'] })
    },
  })
}

export function useTourProgramHistory(mrId: string) {
  return useQuery({
    queryKey: ['tour-program-history', mrId],
    enabled: !!mrId && !!supabase,
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase
        .from('tour_programs')
        .select('*')
        .eq('mr_id', mrId)
        .order('month', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })
}
