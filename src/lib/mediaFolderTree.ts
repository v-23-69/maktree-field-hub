export type EDetailingFolder = {
  id: string
  parent_id: string | null
  name: string
  category_code: string | null
  is_category: boolean
  sort_order: number
  is_enabled: boolean
}

export type FolderTreeNode = EDetailingFolder & {
  children: FolderTreeNode[]
  depth: number
}

export function buildFolderTree(folders: EDetailingFolder[]): FolderTreeNode[] {
  const byParent = new Map<string | null, EDetailingFolder[]>()
  for (const f of folders) {
    const key = f.parent_id
    const list = byParent.get(key) ?? []
    list.push(f)
    byParent.set(key, list)
  }
  for (const list of byParent.values()) {
    list.sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
  }

  const walk = (parentId: string | null, depth: number): FolderTreeNode[] => {
    const items = byParent.get(parentId) ?? []
    return items.map(f => ({
      ...f,
      depth,
      children: walk(f.id, depth + 1),
    }))
  }

  return walk(null, 0)
}

export function getFolderBreadcrumb(
  folderId: string | null,
  folders: EDetailingFolder[],
): EDetailingFolder[] {
  if (!folderId) return []
  const byId = new Map(folders.map(f => [f.id, f]))
  const trail: EDetailingFolder[] = []
  let cur: string | null = folderId
  while (cur) {
    const f = byId.get(cur)
    if (!f) break
    trail.unshift(f)
    cur = f.parent_id
  }
  return trail
}

export function getChildFolders(
  parentId: string | null,
  folders: EDetailingFolder[],
): EDetailingFolder[] {
  return folders
    .filter(f => f.parent_id === parentId)
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
}

export function countFolderItems(
  folderId: string,
  folders: EDetailingFolder[],
  mediaCountByFolder: Map<string | null, number>,
): number {
  const childFolders = folders.filter(f => f.parent_id === folderId)
  let n = mediaCountByFolder.get(folderId) ?? 0
  for (const c of childFolders) {
    n += countFolderItems(c.id, folders, mediaCountByFolder)
  }
  return n
}
