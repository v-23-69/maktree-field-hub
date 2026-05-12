import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Product } from '@/types/database.types'

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async (): Promise<Product[]> => {
      if (!supabase) throw new Error('Supabase not configured')
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('name')
        if (error) throw error
        return (data ?? []) as Product[]
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to load products'
        throw new Error(message)
      }
    },
    enabled: !!supabase,
  })
}

export function useUpdateProductPtr() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ productId, ptr }: { productId: string; ptr: number }) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { error } = await supabase
        .from('products')
        .update({ ptr })
        .eq('id', productId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })
}
