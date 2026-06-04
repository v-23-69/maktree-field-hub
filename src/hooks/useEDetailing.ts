import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { EDetailingFolder } from '@/lib/mediaFolderTree'
import type { ExplorerMediaItem } from '@/lib/explorerMediaOps'

const QK = 'e-detailing'

function publicUrl(path: string): string {
  if (!supabase) return ''
  const { data } = supabase.storage.from('visualizations').getPublicUrl(path)
  return data.publicUrl
}

type MediaRow = {
  id: string
  folder_id: string | null
  storage_path: string
  file_name: string
  mime_type: string | null
  sort_order: number | null
  title: string | null
}

function mapMediaRows(rows: MediaRow[]): ExplorerMediaItem[] {
  return rows.map(row => ({
    id: row.id,
    folder_id: row.folder_id,
    storage_path: row.storage_path,
    file_name: row.file_name,
    mime_type: row.mime_type,
    sort_order: row.sort_order ?? 0,
    title: row.title,
    public_url: publicUrl(row.storage_path),
  }))
}

/** Category/folder tree; ensures folders exist for each doctor speciality (no manual sync). */
export function useEDetailingFolders() {
  return useQuery({
    queryKey: [QK, 'folders'],
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not configured')
      const { error: syncErr } = await supabase.rpc('sync_e_detailing_categories_from_doctors')
      if (syncErr) throw syncErr
      const { data, error } = await supabase
        .from('e_detailing_folders')
        .select('id, parent_id, name, category_code, is_category, sort_order, is_enabled')
        .order('sort_order', { ascending: true })
      if (error) throw error
      return (data ?? []) as EDetailingFolder[]
    },
  })
}

/** Lightweight counts for folder tiles (folder_id only, no image URLs). */
export function useEDetailingMediaCounts() {
  return useQuery({
    queryKey: [QK, 'media-counts'],
    staleTime: 60_000,
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase.from('e_detailing_media').select('folder_id')
      if (error) throw error
      const m = new Map<string | null, number>()
      for (const row of data ?? []) {
        const k = row.folder_id as string | null
        m.set(k, (m.get(k) ?? 0) + 1)
      }
      return m
    },
  })
}

/** Full media for the open folder only (loaded on demand). */
export function useEDetailingFolderMedia(folderId: string | null) {
  return useQuery({
    queryKey: [QK, 'media', 'folder', folderId],
    enabled: !!folderId,
    staleTime: 30_000,
    placeholderData: previous => previous,
    queryFn: async () => {
      if (!supabase || !folderId) throw new Error('Supabase not configured')
      const { data, error } = await supabase
        .from('e_detailing_media')
        .select('id, folder_id, storage_path, file_name, mime_type, sort_order, title')
        .eq('folder_id', folderId)
        .order('sort_order', { ascending: true })
        .order('file_name', { ascending: true })
      if (error) throw error
      return mapMediaRows((data ?? []) as MediaRow[])
    },
  })
}

/** Unassigned files at gallery root (only when needed). */
export function useEDetailingUnassignedMedia(enabled: boolean) {
  return useQuery({
    queryKey: [QK, 'media', 'unassigned'],
    enabled,
    staleTime: 30_000,
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase
        .from('e_detailing_media')
        .select('id, folder_id, storage_path, file_name, mime_type, sort_order, title')
        .is('folder_id', null)
        .order('sort_order', { ascending: true })
        .order('file_name', { ascending: true })
      if (error) throw error
      return mapMediaRows((data ?? []) as MediaRow[])
    },
  })
}

export function invalidateEDetailingQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: [QK] })
}

export function useRenameEDetailingFolder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { folderId: string; name: string }) => {
      if (!supabase) throw new Error('Supabase not configured')
      const name = payload.name.trim()
      if (!name) throw new Error('Name is required')
      const { error } = await supabase
        .from('e_detailing_folders')
        .update({ name })
        .eq('id', payload.folderId)
      if (error) throw error
    },
    onSuccess: () => invalidateEDetailingQueries(queryClient),
  })
}

export function useSaveEDetailingGallery() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      folders: EDetailingFolder[]
      media: ExplorerMediaItem[]
      deletedFolderIds: string[]
      deletedMediaIds: string[]
      deletedStoragePaths: string[]
    }) => {
      if (!supabase) throw new Error('Supabase not configured')

      if (payload.deletedStoragePaths.length > 0) {
        await supabase.storage.from('visualizations').remove(payload.deletedStoragePaths)
      }

      if (payload.deletedMediaIds.length > 0) {
        const { error } = await supabase
          .from('e_detailing_media')
          .delete()
          .in('id', payload.deletedMediaIds)
        if (error) throw error
      }

      if (payload.deletedFolderIds.length > 0) {
        const { error } = await supabase
          .from('e_detailing_folders')
          .delete()
          .in('id', payload.deletedFolderIds)
        if (error) throw error
      }

      const folderUpserts = payload.folders.map(f => ({
        id: f.id.startsWith('temp-') ? undefined : f.id,
        parent_id: f.parent_id,
        name: f.name.trim(),
        category_code: f.category_code,
        is_category: f.is_category,
        sort_order: f.sort_order,
        is_enabled: f.is_enabled,
      }))

      for (const row of folderUpserts) {
        if (row.id) {
          const { error } = await supabase
            .from('e_detailing_folders')
            .update({
              parent_id: row.parent_id,
              name: row.name,
              sort_order: row.sort_order,
              is_enabled: row.is_enabled,
            })
            .eq('id', row.id)
          if (error) throw error
        }
      }

      const newFolders = payload.folders.filter(f => f.id.startsWith('temp-'))
      const idMap = new Map<string, string>()
      for (const f of newFolders) {
        const { data, error } = await supabase
          .from('e_detailing_folders')
          .insert({
            parent_id: f.parent_id,
            name: f.name.trim(),
            category_code: f.category_code,
            is_category: f.is_category,
            sort_order: f.sort_order,
            is_enabled: f.is_enabled,
          })
          .select('id')
          .single()
        if (error) throw error
        idMap.set(f.id, data.id)
      }

      const resolveFolderId = (id: string | null) => {
        if (!id) return null
        return idMap.get(id) ?? id
      }

      for (const m of payload.media) {
        const folderId = resolveFolderId(m.folder_id)
        if (m.id.startsWith('temp-')) {
          const { error } = await supabase.from('e_detailing_media').insert({
            folder_id: folderId,
            storage_path: m.storage_path,
            file_name: m.file_name,
            mime_type: m.mime_type,
            sort_order: m.sort_order,
            title: m.title,
          })
          if (error) throw error
        } else {
          const { error } = await supabase
            .from('e_detailing_media')
            .update({
              folder_id: folderId,
              sort_order: m.sort_order,
              title: m.title,
            })
            .eq('id', m.id)
          if (error) throw error
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QK] })
    },
  })
}

export function useUploadEDetailingImage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { folderId: string; file: File; userId: string }) => {
      if (!supabase) throw new Error('Supabase not configured')
      const ext = payload.file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const safeName = payload.file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `${payload.folderId}/${Date.now()}-${safeName}`
      const { error: upErr } = await supabase.storage
        .from('visualizations')
        .upload(path, payload.file, { upsert: false, contentType: payload.file.type })
      if (upErr) throw upErr

      const { data, error } = await supabase
        .from('e_detailing_media')
        .insert({
          folder_id: payload.folderId,
          storage_path: path,
          file_name: payload.file.name,
          mime_type: payload.file.type,
          sort_order: 0,
          created_by: payload.userId,
        })
        .select('id, folder_id, storage_path, file_name, mime_type, sort_order, title')
        .single()
      if (error) throw error

      return {
        id: data.id,
        folder_id: data.folder_id,
        storage_path: data.storage_path,
        file_name: data.file_name,
        mime_type: data.mime_type,
        sort_order: data.sort_order ?? 0,
        title: data.title,
        public_url: publicUrl(data.storage_path),
      } as ExplorerMediaItem
    },
    onSuccess: () => invalidateEDetailingQueries(queryClient),
  })
}

export function useCreateEDetailingFolder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { name: string; parentId: string | null }) => {
      if (!supabase) throw new Error('Supabase not configured')
      const siblings =
        payload.parentId === null
          ? 0
          : (
              await supabase
                .from('e_detailing_folders')
                .select('id', { count: 'exact', head: true })
                .eq('parent_id', payload.parentId)
            ).count ?? 0
      const { data, error } = await supabase
        .from('e_detailing_folders')
        .insert({
          parent_id: payload.parentId,
          name: payload.name.trim(),
          is_category: false,
          sort_order: (siblings ?? 0) + 1,
        })
        .select('id, parent_id, name, category_code, is_category, sort_order, is_enabled')
        .single()
      if (error) throw error
      return data as EDetailingFolder
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QK] }),
  })
}

export function useDeleteEDetailingFolder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (folderId: string) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { error } = await supabase.from('e_detailing_folders').delete().eq('id', folderId)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QK] }),
  })
}

export function useDeleteEDetailingMedia() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (items: { id: string; storage_path: string }[]) => {
      if (!supabase) throw new Error('Supabase not configured')
      const paths = items.map(i => i.storage_path)
      if (paths.length) {
        await supabase.storage.from('visualizations').remove(paths)
      }
      const ids = items.map(i => i.id)
      const { error } = await supabase.from('e_detailing_media').delete().in('id', ids)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QK] }),
  })
}

export function useMoveEDetailingMedia() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { ids: string[]; targetFolderId: string }) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { error } = await supabase
        .from('e_detailing_media')
        .update({ folder_id: payload.targetFolderId })
        .in('id', payload.ids)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QK] }),
  })
}

export function useCopyEDetailingMedia() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { ids: string[]; targetFolderId: string; items: ExplorerMediaItem[] }) => {
      if (!supabase) throw new Error('Supabase not configured')
      const source = payload.items.filter(m => payload.ids.includes(m.id))
      const rows = source.map((m, i) => ({
        folder_id: payload.targetFolderId,
        storage_path: m.storage_path,
        file_name: m.file_name,
        mime_type: m.mime_type,
        sort_order: m.sort_order + i,
        title: m.title,
      }))
      const { error } = await supabase.from('e_detailing_media').insert(rows)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QK] }),
  })
}

export function useToggleEDetailingFolderPublic() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { folderId: string; is_enabled: boolean }) => {
      if (!supabase) throw new Error('Supabase not configured')
      const { error } = await supabase
        .from('e_detailing_folders')
        .update({ is_enabled: payload.is_enabled })
        .eq('id', payload.folderId)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QK] }),
  })
}
