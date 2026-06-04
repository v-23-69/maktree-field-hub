export type ExplorerMediaItem = {
  id: string
  folder_id: string | null
  storage_path: string
  file_name: string
  mime_type: string | null
  sort_order: number
  title: string | null
  public_url: string
}

export type MediaClipboard =
  | { mode: 'copy'; ids: string[] }
  | { mode: 'cut'; ids: string[] }
  | null

export type UploadProgressState = {
  current: number
  total: number
  percent: number
  fileName: string
} | null

export function applyCopyToFolder(
  items: ExplorerMediaItem[],
  clipboardIds: string[],
  targetFolderId: string,
): ExplorerMediaItem[] {
  const source = items.filter(m => clipboardIds.includes(m.id))
  const maxOrder = Math.max(0, ...items.filter(m => m.folder_id === targetFolderId).map(m => m.sort_order))
  const copies = source.map((m, i) => ({
    ...m,
    id: `temp-${crypto.randomUUID()}`,
    folder_id: targetFolderId,
    sort_order: maxOrder + i + 1,
  }))
  return [...items, ...copies]
}

export function applyCutToFolder(
  items: ExplorerMediaItem[],
  clipboardIds: string[],
  targetFolderId: string,
): ExplorerMediaItem[] {
  const maxOrder = Math.max(0, ...items.filter(m => m.folder_id === targetFolderId).map(m => m.sort_order))
  let offset = 0
  return items.map(m => {
    if (!clipboardIds.includes(m.id)) return m
    offset += 1
    return {
      ...m,
      folder_id: targetFolderId,
      sort_order: maxOrder + offset,
    }
  })
}

export function applyDeleteMedia(
  items: ExplorerMediaItem[],
  ids: string[],
): ExplorerMediaItem[] {
  const set = new Set(ids)
  return items.filter(m => !set.has(m.id))
}

export function getMediaInFolder(
  items: ExplorerMediaItem[],
  folderId: string | null,
): ExplorerMediaItem[] {
  return items
    .filter(m => m.folder_id === folderId)
    .sort((a, b) => a.sort_order - b.sort_order || a.file_name.localeCompare(b.file_name))
}
