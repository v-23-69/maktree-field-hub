import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { User, UserRole } from '@/types/database.types'

export function useAdminUsersList() {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: async (): Promise<User[]> => {
      if (!supabase) throw new Error('Supabase not configured')
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('full_name')
        if (error) throw error
        return (data ?? []) as User[]
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Failed to load users'
        throw new Error(message)
      }
    },
    enabled: !!supabase,
  })
}

export interface CreateUserPayload {
  fullName: string
  employeeCode: string
  email: string
  role: UserRole
  managerIds: string[]
  subAreaIds: string[]
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreateUserPayload) => {
      if (!supabase) throw new Error('Supabase not configured')
      try {
        const { data: inserted, error: insErr } = await supabase
          .from('users')
          .insert({
            employee_code: payload.employeeCode.trim(),
            full_name: payload.fullName.trim(),
            role: payload.role,
            email: payload.email.trim(),
            is_active: true,
          })
          .select('id')
          .single()
        if (insErr) throw insErr

        const { data: fnResult, error: fnErr } =
          await supabase.functions.invoke<{
            id?: string
            error?: string
          }>('create-auth-user', {
            body: {
              employee_code: payload.employeeCode.trim(),
              email: payload.email.trim(),
              full_name: payload.fullName.trim(),
              role: payload.role,
            },
          })

        if (fnErr) throw fnErr
        if (fnResult?.error) throw new Error(fnResult.error)
        if (!fnResult?.id) throw new Error('Auth user was not created')

        if (payload.role === 'mr') {
          if (payload.managerIds.length > 0) {
            const { error: mErr } = await supabase.from('mr_manager_map').insert(
              payload.managerIds.map(manager_id => ({
                mr_id: inserted.id,
                manager_id,
              })),
            )
            if (mErr) throw mErr
          }
          if (payload.subAreaIds.length > 0) {
            const { error: sErr } = await supabase
              .from('mr_sub_area_access')
              .insert(
                payload.subAreaIds.map(sub_area_id => ({
                  mr_id: inserted.id,
                  sub_area_id,
                })),
              )
            if (sErr) throw sErr
          }
        }

        return inserted.id as string
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Could not create user'
        throw new Error(message)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['manager-mrs'] })
    },
  })
}

export function useToggleUserActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (p: { userId: string; isActive: boolean }) => {
      if (!supabase) throw new Error('Supabase not configured')
      try {
        const { error } = await supabase
          .from('users')
          .update({ is_active: !p.isActive })
          .eq('id', p.userId)
        if (error) throw error
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Could not update user'
        throw new Error(message)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })
}

export interface SaveMrAssignmentsPayload {
  mrId: string
  managerIds: string[]
  subAreaIds: string[]
}

export function useSaveMrAssignments() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: SaveMrAssignmentsPayload) => {
      if (!supabase) throw new Error('Supabase not configured')
      try {
        const { error: d1 } = await supabase
          .from('mr_manager_map')
          .delete()
          .eq('mr_id', payload.mrId)
        if (d1) throw d1

        const { error: d2 } = await supabase
          .from('mr_sub_area_access')
          .delete()
          .eq('mr_id', payload.mrId)
        if (d2) throw d2

        if (payload.managerIds.length > 0) {
          const { error: mErr } = await supabase.from('mr_manager_map').insert(
            payload.managerIds.map(manager_id => ({
              mr_id: payload.mrId,
              manager_id,
            })),
          )
          if (mErr) throw mErr
        }

        if (payload.subAreaIds.length > 0) {
          const { error: sErr } = await supabase
            .from('mr_sub_area_access')
            .insert(
              payload.subAreaIds.map(sub_area_id => ({
                mr_id: payload.mrId,
                sub_area_id,
              })),
            )
          if (sErr) throw sErr
        }
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Could not save assignments'
        throw new Error(message)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['mr-sub-areas'] })
      queryClient.invalidateQueries({ queryKey: ['manager-mrs'] })
    },
  })
}

export function useMrAssignments(mrId: string) {
  return useQuery({
    queryKey: ['mr-assignments', mrId],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not configured')
      try {
        const [mRes, sRes] = await Promise.all([
          supabase.from('mr_manager_map').select('manager_id').eq('mr_id', mrId),
          supabase.from('mr_sub_area_access').select('sub_area_id').eq('mr_id', mrId),
        ])
        if (mRes.error) throw mRes.error
        if (sRes.error) throw sRes.error
        return {
          managerIds: (mRes.data ?? []).map(r => r.manager_id as string),
          subAreaIds: (sRes.data ?? []).map(r => r.sub_area_id as string),
        }
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Failed to load assignments'
        throw new Error(message)
      }
    },
    enabled: !!mrId && !!supabase,
  })
}
