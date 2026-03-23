import { useQuery } from '@tanstack/react-query'
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
