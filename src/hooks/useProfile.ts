import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { UserProfile } from '@/types/database.types'

export function useProfile(userId?: string) {
  return useQuery({
    queryKey: ['profile', userId],
    enabled: !!userId && !!supabase,
    queryFn: async (): Promise<UserProfile> => {
      if (!supabase || !userId) throw new Error('Supabase not configured')
      const { data, error } = await supabase.from('users').select('*').eq('id', userId).single()
      if (error) throw error
      return data as UserProfile
    },
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { userId: string; updates: Partial<UserProfile> }) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { error } = await supabase.from('users').update(payload.updates).eq('id', payload.userId)
      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['profile', vars.userId] })
    },
  })
}

export function useUploadProfilePhoto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { userId: string; authUserId: string; file: File }) => {
      if (!supabase) throw new Error('Supabase not configured')
      const ext = payload.file.name.split('.').pop() || 'jpg'
      const path = `${payload.authUserId}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(path, payload.file, { upsert: true, contentType: payload.file.type })
      if (uploadError) throw uploadError

      const { data: pub } = supabase.storage.from('profile-photos').getPublicUrl(path)
      const url = pub.publicUrl
      const { error: updateError } = await supabase
        .from('users')
        .update({ profile_photo_url: url })
        .eq('id', payload.userId)
      if (updateError) throw updateError
      return url
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['profile', vars.userId] })
    },
  })
}
