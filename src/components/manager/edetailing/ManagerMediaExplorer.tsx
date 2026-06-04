import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Copy,
  Scissors,
  ClipboardPaste,
  Folder,
  FolderOpen,
  FolderPlus,
  Upload,
  Trash2,
  EyeOff,
  Check,
  MoreVertical,
  Presentation,
  ImageIcon,
  CheckSquare,
  Pencil,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  buildFolderTree,
  getChildFolders,
  getFolderBreadcrumb,
  countFolderItems,
  type EDetailingFolder,
} from '@/lib/mediaFolderTree'
import type { ExplorerMediaItem, MediaClipboard, UploadProgressState } from '@/lib/explorerMediaOps'
import {
  useEDetailingFolders,
  useEDetailingMediaCounts,
  useEDetailingFolderMedia,
  useEDetailingUnassignedMedia,
  invalidateEDetailingQueries,
  useUploadEDetailingImage,
  useCreateEDetailingFolder,
  useDeleteEDetailingFolder,
  useDeleteEDetailingMedia,
  useMoveEDetailingMedia,
  useCopyEDetailingMedia,
  useToggleEDetailingFolderPublic,
  useRenameEDetailingFolder,
} from '@/hooks/useEDetailing'
import { useAuth } from '@/hooks/useAuth'
import { useQueryClient } from '@tanstack/react-query'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import EDetailingSlideshow from './EDetailingSlideshow'

const LONG_PRESS_MS = 480
const DRAG_MEDIA_TYPE = 'application/x-edetailing-media-ids'

function canDeleteFolder(folder: EDetailingFolder | undefined): boolean {
  return !!folder && !folder.is_category
}

export default function ManagerMediaExplorer() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const isMobile = useIsMobile()
  const { data: folders = [], isLoading: foldersLoading } = useEDetailingFolders()
  const { data: mediaCountByFolder } = useEDetailingMediaCounts()
  const [openFolderId, setOpenFolderId] = useState<string | null>(null)
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set())
  const [selectedFolderIds, setSelectedFolderIds] = useState<Set<string>>(new Set())
  const [fileSelectMode, setFileSelectMode] = useState(false)
  const [folderSelectMode, setFolderSelectMode] = useState(false)
  const [clipboard, setClipboard] = useState<MediaClipboard>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [newFolderOpen, setNewFolderOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [slideshowOpen, setSlideshowOpen] = useState(false)
  const [slideshowStart, setSlideshowStart] = useState(0)
  const [deleteFolderId, setDeleteFolderId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgressState>(null)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const didLongPress = useRef(false)
  const lastFolderClickId = useRef<string | null>(null)
  const lastFileClickId = useRef<string | null>(null)
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameName, setRenameName] = useState('')
  const [expandedTreeIds, setExpandedTreeIds] = useState<Set<string>>(new Set())
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null)
  const [contentDropActive, setContentDropActive] = useState(false)
  const contentPaneRef = useRef<HTMLDivElement>(null)

  const uploadImage = useUploadEDetailingImage()
  const renameFolder = useRenameEDetailingFolder()
  const createFolder = useCreateEDetailingFolder()
  const deleteFolder = useDeleteEDetailingFolder()
  const deleteMedia = useDeleteEDetailingMedia()
  const moveMedia = useMoveEDetailingMedia()
  const copyMedia = useCopyEDetailingMedia()
  const togglePublic = useToggleEDetailingFolderPublic()

  const unassignedCount = mediaCountByFolder?.get(null) ?? 0
  const { data: folderMedia = [], isFetching: folderMediaLoading } =
    useEDetailingFolderMedia(openFolderId)
  const { data: unassignedMedia = [] } = useEDetailingUnassignedMedia(
    openFolderId === null && unassignedCount > 0,
  )

  const onRefresh = () => invalidateEDetailingQueries(queryClient)

  const countMap = mediaCountByFolder ?? new Map<string | null, number>()
  const filesInView = folderMedia

  const visibleFiles = useMemo(
    () => (openFolderId ? filesInView : unassignedMedia),
    [openFolderId, filesInView, unassignedMedia],
  )

  const mediaById = useMemo(() => {
    const m = new Map<string, ExplorerMediaItem>()
    for (const item of [...folderMedia, ...unassignedMedia]) m.set(item.id, item)
    return m
  }, [folderMedia, unassignedMedia])

  const breadcrumb = useMemo(
    () => getFolderBreadcrumb(openFolderId, folders),
    [openFolderId, folders],
  )

  useEffect(() => {
    if (!openFolderId) return
    const ids = [...breadcrumb.map(b => b.id), openFolderId]
    setExpandedTreeIds(prev => new Set([...prev, ...ids]))
  }, [openFolderId, breadcrumb])

  const openFolder = useMemo(
    () => (openFolderId ? folders.find(f => f.id === openFolderId) ?? null : null),
    [openFolderId, folders],
  )

  const childFolders = useMemo(
    () => getChildFolders(openFolderId, folders),
    [openFolderId, folders],
  )

  const rootCategories = useMemo(() => getChildFolders(null, folders), [folders])

  const tree = useMemo(() => buildFolderTree(folders), [folders])

  const pasteTargetFolderId = useMemo(() => {
    if (selectedFolderIds.size === 1) return [...selectedFolderIds][0]
    return openFolderId
  }, [selectedFolderIds, openFolderId])

  const canPaste = Boolean(clipboard?.ids.length && pasteTargetFolderId)

  const clearSelection = useCallback(() => {
    setSelectedFileIds(new Set())
    setSelectedFolderIds(new Set())
    setFileSelectMode(false)
    setFolderSelectMode(false)
  }, [])

  useEffect(() => {
    if (isMobile) return
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      const mod = e.ctrlKey || e.metaKey
      const key = e.key.toLowerCase()
      if (mod && key === 'c' && selectedFileIds.size > 0) {
        e.preventDefault()
        handleCopy()
      } else if (mod && key === 'x' && selectedFileIds.size > 0) {
        e.preventDefault()
        handleCut()
      } else if (mod && key === 'v' && canPaste) {
        e.preventDefault()
        void handlePaste()
      } else if ((key === 'delete' || key === 'backspace') && selectedFileIds.size > 0) {
        e.preventDefault()
        void handleDeleteFiles()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  const handleBack = () => {
    if (!openFolder) {
      setOpenFolderId(null)
      return
    }
    setOpenFolderId(openFolder.parent_id)
    clearSelection()
  }

  const openFolderById = (id: string) => {
    setOpenFolderId(id)
    clearSelection()
    setShowUpload(false)
  }

  const handleCopy = () => {
    if (selectedFileIds.size === 0) return
    setClipboard({ mode: 'copy', ids: [...selectedFileIds] })
    toast.success('Copied to clipboard')
  }

  const handleCut = () => {
    if (selectedFileIds.size === 0) return
    setClipboard({ mode: 'cut', ids: [...selectedFileIds] })
    toast.success('Cut to clipboard')
  }

  const handlePaste = async () => {
    if (!clipboard || clipboard.ids.length === 0) return
    const target = pasteTargetFolderId
    if (!target) {
      toast.error('Open or select one folder to paste into')
      return
    }
    if (selectedFolderIds.size > 1) {
      toast.error('Select only one folder to paste into')
      return
    }
    try {
      if (clipboard.mode === 'cut') {
        await moveMedia.mutateAsync({ ids: clipboard.ids, targetFolderId: target })
        setClipboard(null)
        toast.success('Moved')
      } else {
        await copyMedia.mutateAsync({
          ids: clipboard.ids,
          targetFolderId: target,
        })
        toast.success('Pasted copies')
      }
      clearSelection()
      onRefresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Paste failed')
    }
  }

  const handleDeleteFiles = async () => {
    const ids = [...selectedFileIds]
    if (!ids.length) return
    const items = ids
      .map(id => mediaById.get(id))
      .filter((m): m is ExplorerMediaItem => !!m)
    try {
      await deleteMedia.mutateAsync(items.map(m => ({ id: m.id, storage_path: m.storage_path })))
      toast.success('Deleted')
      clearSelection()
      onRefresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  const handleDeleteAllUnassigned = async () => {
    if (!unassignedMedia.length) return
    try {
      await deleteMedia.mutateAsync(
        unassignedMedia.map(m => ({ id: m.id, storage_path: m.storage_path })),
      )
      toast.success('Removed unassigned files')
      onRefresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  const handleCreateFolder = async () => {
    const name = newFolderName.trim()
    if (!name) {
      toast.error('Enter a folder name')
      return
    }
    try {
      await createFolder.mutateAsync({ name, parentId: openFolderId })
      toast.success(openFolderId ? 'Folder created' : 'Category requires seeded folders at root')
      setNewFolderOpen(false)
      setNewFolderName('')
      onRefresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create folder')
    }
  }

  const handleUploadFiles = async (fileList: FileList | null, targetFolderId?: string | null) => {
    const folderId = targetFolderId ?? openFolderId
    if (!fileList?.length || !folderId || !user?.id) return
    const files = [...fileList].filter(f => f.type.startsWith('image/')).slice(0, 40)
    if (!files.length) {
      toast.error('Choose image files only')
      return
    }
    setUploading(true)
    setUploadProgress({ current: 0, total: files.length, percent: 0, fileName: files[0].name })
    let ok = 0
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setUploadProgress({
          current: i + 1,
          total: files.length,
          percent: Math.round((i / files.length) * 100),
          fileName: file.name,
        })
        await uploadImage.mutateAsync({ folderId, file, userId: user.id })
        ok += 1
        setUploadProgress({
          current: i + 1,
          total: files.length,
          percent: Math.round(((i + 1) / files.length) * 100),
          fileName: file.name,
        })
      }
      toast.success(`Uploaded ${ok} image(s)`)
      setShowUpload(false)
      onRefresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
      setUploadProgress(null)
    }
  }

  const handleFileClick = (id: string, index: number, e: MouseEvent) => {
    const multi = e.ctrlKey || e.metaKey
    const range = e.shiftKey

    if (fileSelectMode || multi) {
      e.preventDefault()
      setFileSelectMode(true)
      setSelectedFileIds(prev => {
        const next = new Set(prev)
        if (multi || fileSelectMode) {
          if (next.has(id)) next.delete(id)
          else next.add(id)
        } else {
          next.clear()
          next.add(id)
        }
        return next
      })
      lastFileClickId.current = id
      return
    }

    if (range && lastFileClickId.current) {
      e.preventDefault()
      setFileSelectMode(true)
      const ids = visibleFiles.map(f => f.id)
      const a = ids.indexOf(lastFileClickId.current)
      const b = ids.indexOf(id)
      if (a >= 0 && b >= 0) {
        const [lo, hi] = a < b ? [a, b] : [b, a]
        setSelectedFileIds(new Set(ids.slice(lo, hi + 1)))
      }
      return
    }

    lastFileClickId.current = id

    if (isMobile && !fileSelectMode) {
      setSlideshowStart(index)
      setSlideshowOpen(true)
      return
    }

    if (!fileSelectMode) {
      setSelectedFileIds(new Set([id]))
    }
  }

  const startLongPressFile = (id: string) => {
    if (!isMobile) return
    didLongPress.current = false
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true
      setFileSelectMode(true)
      setSelectedFileIds(new Set([id]))
      if (navigator.vibrate) navigator.vibrate(10)
    }, LONG_PRESS_MS)
  }

  const cancelLongPress = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
  }

  const startLongPressFolder = (id: string) => {
    if (!isMobile) return
    didLongPress.current = false
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true
      setFolderSelectMode(true)
      setSelectedFolderIds(new Set([id]))
      if (navigator.vibrate) navigator.vibrate(10)
    }, LONG_PRESS_MS)
  }

  const visibleFolderTiles = useMemo(
    () => (openFolderId ? childFolders : rootCategories),
    [openFolderId, childFolders, rootCategories],
  )

  const selectedDeletableFolder = useMemo(() => {
    if (selectedFolderIds.size !== 1) return null
    const id = [...selectedFolderIds][0]
    const f = folders.find(x => x.id === id)
    return canDeleteFolder(f) ? f : null
  }, [selectedFolderIds, folders])

  const handleFolderClick = (folder: EDetailingFolder, e: MouseEvent) => {
    const multi = e.ctrlKey || e.metaKey
    const range = e.shiftKey

    if (folderSelectMode || multi) {
      e.preventDefault()
      setFolderSelectMode(true)
      setSelectedFolderIds(prev => {
        const next = new Set(prev)
        if (multi) {
          if (next.has(folder.id)) next.delete(folder.id)
          else next.add(folder.id)
        } else {
          next.clear()
          next.add(folder.id)
        }
        return next
      })
      lastFolderClickId.current = folder.id
      return
    }

    if (range && lastFolderClickId.current) {
      e.preventDefault()
      setFolderSelectMode(true)
      const ids = visibleFolderTiles.map(f => f.id)
      const a = ids.indexOf(lastFolderClickId.current)
      const b = ids.indexOf(folder.id)
      if (a >= 0 && b >= 0) {
        const [lo, hi] = a < b ? [a, b] : [b, a]
        setSelectedFolderIds(new Set(ids.slice(lo, hi + 1)))
      }
      return
    }

    lastFolderClickId.current = folder.id
    setSelectedFolderIds(new Set([folder.id]))
    setSelectedFileIds(new Set())
  }

  const handleDropFilesOnFolder = async (folderId: string, e: React.DragEvent) => {
    e.preventDefault()
    setDragOverFolderId(null)
    if (isMobile) return

    const raw = e.dataTransfer.getData(DRAG_MEDIA_TYPE)
    if (raw) {
      try {
        const ids: string[] = JSON.parse(raw)
        if (ids.length) {
          await moveMedia.mutateAsync({ ids, targetFolderId: folderId })
          toast.success('Moved')
          clearSelection()
          onRefresh()
        }
      } catch {
        toast.error('Move failed')
      }
      return
    }

    if (e.dataTransfer.files?.length) {
      await handleUploadFiles(e.dataTransfer.files, folderId)
    }
  }

  const handleContentDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setContentDropActive(false)
    if (isMobile) return

    const raw = e.dataTransfer.getData(DRAG_MEDIA_TYPE)
    if (raw && openFolderId) {
      try {
        const ids: string[] = JSON.parse(raw)
        if (ids.length) {
          await moveMedia.mutateAsync({ ids, targetFolderId: openFolderId })
          toast.success('Moved')
          clearSelection()
          onRefresh()
        }
      } catch {
        toast.error('Move failed')
      }
      return
    }

    if (e.dataTransfer.files?.length) {
      if (!openFolderId) {
        toast.error('Create or open a category folder first, then upload inside it')
        return
      }
      await handleUploadFiles(e.dataTransfer.files, openFolderId)
    }
  }

  const handleContentPaneClick = (e: React.MouseEvent) => {
    if (isMobile || slideshowOpen) return
    if (e.target === e.currentTarget) clearSelection()
  }

  const getDragFileIds = (itemId: string) =>
    selectedFileIds.size > 0 && selectedFileIds.has(itemId)
      ? [...selectedFileIds]
      : [itemId]

  const openSlideshowAt = (index: number) => {
    setSlideshowStart(index)
    setSlideshowOpen(true)
  }

  const openRenameDialog = (folder: EDetailingFolder) => {
    setRenameName(folder.name)
    setRenameOpen(true)
  }

  const handleRenameFolder = async () => {
    if (!openFolder) return
    const name = renameName.trim()
    if (!name) {
      toast.error('Enter a name')
      return
    }
    try {
      await renameFolder.mutateAsync({ folderId: openFolder.id, name })
      toast.success('Renamed')
      setRenameOpen(false)
      onRefresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Rename failed')
    }
  }

  const promptDeleteSelectedFolder = () => {
    const id =
      selectedDeletableFolder?.id ??
      (selectedFolderIds.size === 1 ? [...selectedFolderIds][0] : null)
    if (!id) {
      toast.error('Select one subfolder to delete (doctor categories cannot be removed)')
      return
    }
    const f = folders.find(x => x.id === id)
    if (!canDeleteFolder(f)) {
      toast.error('Doctor categories are synced from your doctor list — use Active off instead')
      return
    }
    setDeleteFolderId(id)
  }

  const renderFolderTile = (folder: EDetailingFolder) => {
    const count = countFolderItems(folder.id, folders, countMap)
    const selected = selectedFolderIds.has(folder.id)
    const isDropTarget = dragOverFolderId === folder.id

    const tile = (
      <button
        type="button"
        className={cn(
          'flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-border/50 bg-card hover:border-primary/40 transition-all text-left w-full',
          selected && 'ring-2 ring-primary border-primary/50',
          isDropTarget && 'border-primary bg-primary/5 ring-2 ring-primary/40',
          !folder.is_enabled && 'opacity-80',
        )}
        onClick={e => {
          if (isMobile && didLongPress.current) {
            didLongPress.current = false
            if (folderSelectMode) {
              setSelectedFolderIds(prev => {
                const next = new Set(prev)
                if (next.has(folder.id)) next.delete(folder.id)
                else next.add(folder.id)
                return next
              })
            }
            return
          }
          if (isMobile && folderSelectMode) {
            setSelectedFolderIds(prev => {
              const next = new Set(prev)
              if (next.has(folder.id)) next.delete(folder.id)
              else next.add(folder.id)
              return next
            })
            return
          }
          if (isMobile) openFolderById(folder.id)
          else handleFolderClick(folder, e)
        }}
        onDoubleClick={() => {
          if (isMobile) return
          setFolderSelectMode(false)
          openFolderById(folder.id)
        }}
        onTouchStart={() => startLongPressFolder(folder.id)}
        onTouchEnd={cancelLongPress}
        onTouchMove={cancelLongPress}
        onDragOver={e => {
          if (isMobile) return
          e.preventDefault()
          setDragOverFolderId(folder.id)
        }}
        onDragLeave={() => setDragOverFolderId(id => (id === folder.id ? null : id))}
        onDrop={e => void handleDropFilesOnFolder(folder.id, e)}
      >
        <div className="relative">
          <Folder className="h-10 w-10 text-amber-500" />
          {!folder.is_enabled && (
            <EyeOff className="absolute -top-1 -right-1 h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>
        <span className="text-xs font-semibold text-center line-clamp-2">{folder.name}</span>
        <span className="text-[10px] text-muted-foreground">{count} items</span>
      </button>
    )

    if (isMobile) {
      return (
        <div key={folder.id}>
          {tile}
        </div>
      )
    }

    return (
      <ContextMenu key={folder.id}>
        <ContextMenuTrigger asChild>{tile}</ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={() => openFolderById(folder.id)}>
            <FolderOpen className="h-4 w-4 mr-2" />
            Open
          </ContextMenuItem>
          {clipboard && (
            <ContextMenuItem
              onClick={() => {
                setSelectedFolderIds(new Set([folder.id]))
                void handlePaste()
              }}
            >
              <ClipboardPaste className="h-4 w-4 mr-2" />
              Paste into folder
            </ContextMenuItem>
          )}
          {canDeleteFolder(folder) && (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteFolderId(folder.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete folder
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>
    )
  }

  const renderFileTile = (item: ExplorerMediaItem, index: number) => {
    const selected = selectedFileIds.has(item.id)

    const tile = (
      <button
        type="button"
        draggable={!isMobile}
        className={cn(
          'relative aspect-square rounded-lg overflow-hidden border-2 border-border/40 bg-muted w-full',
          selected && 'ring-2 ring-primary border-primary/50',
          !isMobile && 'hover:border-primary/30',
        )}
        onClick={e => {
          if (isMobile && didLongPress.current) {
            didLongPress.current = false
            if (fileSelectMode) {
              setSelectedFileIds(prev => {
                const next = new Set(prev)
                if (next.has(item.id)) next.delete(item.id)
                else next.add(item.id)
                return next
              })
            }
            return
          }
          if (isMobile && fileSelectMode) {
            setSelectedFileIds(prev => {
              const next = new Set(prev)
              if (next.has(item.id)) next.delete(item.id)
              else next.add(item.id)
              return next
            })
            return
          }
          if (isMobile) {
            e.preventDefault()
            openSlideshowAt(index)
            return
          }
          handleFileClick(item.id, index, e)
        }}
        onDoubleClick={() => {
          if (!isMobile && !fileSelectMode) openSlideshowAt(index)
        }}
        onTouchStart={() => startLongPressFile(item.id)}
        onTouchEnd={cancelLongPress}
        onTouchMove={cancelLongPress}
        onDragStart={e => {
          if (isMobile) return
          const ids = getDragFileIds(item.id)
          e.dataTransfer.setData(DRAG_MEDIA_TYPE, JSON.stringify(ids))
          e.dataTransfer.effectAllowed = 'move'
        }}
      >
        <img
          src={item.public_url}
          alt=""
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover pointer-events-none"
        />
        {selected && (
          <span className="absolute top-1 left-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
            <Check className="h-3 w-3 text-primary-foreground" />
          </span>
        )}
      </button>
    )

    if (isMobile) {
      return (
        <div key={item.id}>
          {tile}
        </div>
      )
    }

    return (
      <ContextMenu key={item.id}>
        <ContextMenuTrigger asChild>{tile}</ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem
            onClick={() => {
              setSelectedFileIds(new Set([item.id]))
              openSlideshowAt(index)
            }}
          >
            <Presentation className="h-4 w-4 mr-2" />
            Open slideshow
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={() => {
              setSelectedFileIds(new Set([item.id]))
              handleCopy()
            }}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => {
              setSelectedFileIds(new Set([item.id]))
              handleCut()
            }}
          >
            <Scissors className="h-4 w-4 mr-2" />
            Cut
          </ContextMenuItem>
          {canPaste && (
            <ContextMenuItem onClick={() => void handlePaste()}>
              <ClipboardPaste className="h-4 w-4 mr-2" />
              Paste
            </ContextMenuItem>
          )}
          <ContextMenuSeparator />
          <ContextMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => {
              setSelectedFileIds(new Set([item.id]))
              void handleDeleteFiles()
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    )
  }

  const toggleTreeExpand = (id: string) => {
    setExpandedTreeIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const TreeBranch = ({ nodes, depth = 0 }: { nodes: typeof tree; depth?: number }) => (
    <ul className={cn('space-y-0.5', depth > 0 && 'ml-3 border-l border-border/40 pl-2')}>
      {nodes.map(node => {
        const hasChildren = node.children.length > 0
        const expanded = expandedTreeIds.has(node.id)
        return (
          <li key={node.id}>
            <div className="flex items-center gap-0.5">
              {hasChildren ? (
                <button
                  type="button"
                  className="h-7 w-6 shrink-0 flex items-center justify-center rounded hover:bg-muted/80"
                  aria-label={expanded ? 'Collapse' : 'Expand'}
                  onClick={() => toggleTreeExpand(node.id)}
                >
                  {expanded ? (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </button>
              ) : (
                <span className="w-6 shrink-0" />
              )}
              <button
                type="button"
                className={cn(
                  'flex-1 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium hover:bg-muted/80 text-left min-w-0',
                  openFolderId === node.id && 'bg-primary/10 text-primary',
                )}
                onClick={() => openFolderById(node.id)}
              >
                <Folder className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span className="truncate flex-1">{node.name}</span>
              </button>
            </div>
            {hasChildren && expanded && <TreeBranch nodes={node.children} depth={depth + 1} />}
          </li>
        )
      })}
    </ul>
  )

  const totalFileCount = useMemo(() => {
    let n = 0
    for (const v of countMap.values()) n += v
    return n
  }, [countMap])

  if (foldersLoading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 min-h-[60vh]">
      {!isMobile && (
        <aside className="hidden md:block w-52 shrink-0 rounded-xl border border-border/50 bg-card/50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-2">
            Categories
          </p>
          <TreeBranch nodes={tree} />
        </aside>
      )}

      <div
        ref={contentPaneRef}
        className={cn(
          'flex-1 min-w-0 space-y-3 rounded-xl transition-colors',
          contentDropActive && openFolderId && 'ring-2 ring-primary/40 bg-primary/5',
        )}
        onClick={handleContentPaneClick}
        onDragOver={e => {
          if (isMobile) return
          if (e.dataTransfer.types.includes(DRAG_MEDIA_TYPE) || e.dataTransfer.types.includes('Files')) {
            e.preventDefault()
            setContentDropActive(true)
          }
        }}
        onDragLeave={e => {
          if (e.currentTarget.contains(e.relatedTarget as Node)) return
          setContentDropActive(false)
        }}
        onDrop={e => void handleContentDrop(e)}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 gap-1"
            disabled={!openFolderId}
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <nav className="flex flex-wrap items-center gap-1 text-xs font-medium min-w-0 flex-1">
            <button
              type="button"
              className="text-primary hover:underline"
              onClick={() => {
                setOpenFolderId(null)
                clearSelection()
              }}
            >
              Gallery
            </button>
            {breadcrumb.map(seg => (
              <span key={seg.id} className="flex items-center gap-1">
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                <button
                  type="button"
                  className="text-primary hover:underline truncate max-w-[120px]"
                  onClick={() => openFolderById(seg.id)}
                >
                  {seg.name}
                </button>
              </span>
            ))}
          </nav>
        </div>

        <div className="flex flex-wrap gap-2">
          {!isMobile && (
            <>
              <Button
                type="button"
                size="sm"
                variant={fileSelectMode ? 'secondary' : 'outline'}
                className="h-9 gap-1"
                onClick={() => {
                  setFileSelectMode(v => !v)
                  if (fileSelectMode) setSelectedFileIds(new Set())
                }}
              >
                <CheckSquare className="h-3.5 w-3.5" />
                {fileSelectMode ? 'Selecting files' : 'Select files'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant={folderSelectMode ? 'secondary' : 'outline'}
                className="h-9 gap-1"
                onClick={() => {
                  setFolderSelectMode(v => !v)
                  if (folderSelectMode) setSelectedFolderIds(new Set())
                }}
              >
                <CheckSquare className="h-3.5 w-3.5" />
                {folderSelectMode ? 'Selecting folders' : 'Select folders'}
              </Button>
            </>
          )}
          {(selectedFileIds.size > 0 || clipboard) && (
            <>
              {selectedFileIds.size > 0 && (
                <>
                  <Button type="button" size="sm" variant="outline" className="h-9 gap-1" onClick={handleCopy}>
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </Button>
                  <Button type="button" size="sm" variant="outline" className="h-9 gap-1" onClick={handleCut}>
                    <Scissors className="h-3.5 w-3.5" /> Cut
                  </Button>
                </>
              )}
              {canPaste && (
                <Button type="button" size="sm" variant="outline" className="h-9 gap-1" onClick={() => void handlePaste()}>
                  <ClipboardPaste className="h-3.5 w-3.5" /> Paste
                </Button>
              )}
              {selectedFileIds.size > 0 && (
                <Button type="button" size="sm" variant="destructive" className="h-9 gap-1" onClick={() => void handleDeleteFiles()}>
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              )}
            </>
          )}
          {selectedDeletableFolder && (
            <Button
              type="button"
              size="sm"
              variant="destructive"
              className="h-9 gap-1"
              onClick={promptDeleteSelectedFolder}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete folder
            </Button>
          )}
          {openFolderId && (
            <>
              <Button type="button" size="sm" variant="outline" className="h-9 gap-1" onClick={() => setNewFolderOpen(true)}>
                <FolderPlus className="h-3.5 w-3.5" />
                New folder
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-9 gap-1"
                onClick={() => setShowUpload(v => !v)}
              >
                <Upload className="h-3.5 w-3.5" />
                Upload
              </Button>
              {filesInView.length > 0 && (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-9 gap-1"
                  onClick={() => openSlideshowAt(0)}
                >
                  <Presentation className="h-3.5 w-3.5" />
                  Slideshow
                </Button>
              )}
            </>
          )}
          {isMobile && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" size="sm" variant="outline" className="h-9 w-9 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {openFolderId && (
                  <>
                    <DropdownMenuItem onClick={() => setNewFolderOpen(true)}>
                      <FolderPlus className="h-4 w-4 mr-2" />
                      New folder
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowUpload(true)}>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload images
                    </DropdownMenuItem>
                    {filesInView.length > 0 && (
                      <DropdownMenuItem
                        onClick={() => {
                          openSlideshowAt(0)
                        }}
                      >
                        <Presentation className="h-4 w-4 mr-2" />
                        Slideshow
                      </DropdownMenuItem>
                    )}
                  </>
                )}
                {selectedFileIds.size > 0 && (
                  <>
                    <DropdownMenuItem onClick={handleCopy}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleCut}>
                      <Scissors className="h-4 w-4 mr-2" />
                      Cut
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => void handleDeleteFiles()}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete selected
                    </DropdownMenuItem>
                  </>
                )}
                {canPaste && (
                  <DropdownMenuItem onClick={() => void handlePaste()}>
                    <ClipboardPaste className="h-4 w-4 mr-2" />
                    Paste
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {showUpload && openFolderId && (
          <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-4 space-y-3">
            <Label className="text-xs font-semibold">Upload images (max 40 per batch)</Label>
            <Input
              type="file"
              accept="image/*"
              multiple
              disabled={uploading}
              onChange={e => void handleUploadFiles(e.target.files)}
            />
            {uploading && uploadProgress && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="truncate pr-2">
                    Uploading {uploadProgress.current}/{uploadProgress.total}: {uploadProgress.fileName}
                  </span>
                  <span className="font-semibold tabular-nums">{uploadProgress.percent}%</span>
                </div>
                <Progress value={uploadProgress.percent} className="h-2" />
              </div>
            )}
          </div>
        )}

        {openFolder && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/50 bg-card p-3">
            <div>
              <h3 className="text-sm font-bold">{openFolder.name}</h3>
              <p className="text-[10px] text-muted-foreground">
                {openFolder.is_category ? 'Doctor category' : 'Folder'} · {filesInView.length} files
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1 text-xs"
                onClick={() => openRenameDialog(openFolder)}
              >
                <Pencil className="h-3.5 w-3.5" />
                Rename
              </Button>
              <div className="flex items-center gap-2">
                <Switch
                  checked={openFolder.is_enabled}
                  onCheckedChange={v =>
                    void togglePublic.mutateAsync({ folderId: openFolder.id, is_enabled: v }).then(onRefresh)
                  }
                />
                <span className="text-xs">Active</span>
              </div>
              {canDeleteFolder(openFolder) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => setDeleteFolderId(openFolder.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}

        {!openFolderId ? (
          <>
            <p className="section-title">Doctor categories</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {rootCategories.map(renderFolderTile)}
            </div>
            <p className="text-[10px] text-muted-foreground">
              {isMobile
                ? 'Tap to open a category · Long-press to select folders'
                : 'Click to select · Double-click to open · Drag photos onto a folder to move'}
            </p>
            {unassignedMedia.length > 0 && (
              <div className="space-y-2 pt-4 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold">
                    Not in any folder · {unassignedMedia.length}
                  </p>
                  <Button type="button" variant="destructive" size="sm" className="h-8 text-xs" onClick={() => void handleDeleteAllUnassigned()}>
                    Delete all
                  </Button>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {unassignedMedia.map((m, i) => renderFileTile(m, i))}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {isMobile
                    ? 'Move into a category with Cut/Copy, then open folder and Paste'
                    : 'Select files → Cut or Copy → open a category → Paste'}
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            {childFolders.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">Subfolders</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {childFolders.map(renderFolderTile)}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Files in this folder</p>
              {folderMediaLoading && filesInView.length === 0 ? (
                <div className="flex justify-center py-10">
                  <LoadingSpinner />
                </div>
              ) : filesInView.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No images yet — use Upload
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {filesInView.map((m, i) => renderFileTile(m, i))}
                </div>
              )}
              <p className="text-[10px] text-muted-foreground">
                {isMobile
                  ? 'Tap to preview · Long-press to select multiple · ⋮ for upload & slideshow'
                  : 'Click to select · Double-click slideshow · Right-click for menu · Drag to move'}
              </p>
            </div>
          </>
        )}

        <p className="text-[10px] text-muted-foreground border-t border-border/40 pt-2">
          {rootCategories.length} categories · {childFolders.length > 0 && openFolderId ? `${childFolders.length} subfolders · ` : ''}
          {totalFileCount} files
          {selectedFileIds.size > 0 && ` · ${selectedFileIds.size} file(s) selected`}
          {selectedFolderIds.size > 0 && ` · ${selectedFolderIds.size} folder(s) selected`}
          {uploading && uploadProgress && ` · Uploading ${uploadProgress.percent}%`}
          {openFolder && !openFolder.is_enabled && ' · Hidden (Active off)'}
        </p>
      </div>

      {isMobile && (fileSelectMode || folderSelectMode) && (
        <div className="fixed bottom-20 left-0 right-0 z-40 mx-3 flex items-center justify-between gap-2 rounded-xl border border-border bg-card/95 backdrop-blur p-3 shadow-lg">
          <Button type="button" variant="ghost" size="sm" onClick={clearSelection}>
            Cancel
          </Button>
          <span className="text-xs font-semibold">
            {fileSelectMode ? `${selectedFileIds.size} selected` : `${selectedFolderIds.size} selected`}
          </span>
          <div className="flex gap-1">
            {fileSelectMode && (
              <>
                <Button type="button" size="sm" variant="outline" onClick={handleCopy}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={handleCut}>
                  <Scissors className="h-4 w-4" />
                </Button>
                {canPaste && (
                  <Button type="button" size="sm" variant="outline" onClick={() => void handlePaste()}>
                    <ClipboardPaste className="h-4 w-4" />
                  </Button>
                )}
                {selectedFileIds.size > 0 && (
                  <Button type="button" size="sm" variant="destructive" onClick={() => void handleDeleteFiles()}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </>
            )}
            {folderSelectMode && (
              <>
                {canPaste && selectedFolderIds.size === 1 && (
                  <Button type="button" size="sm" variant="outline" onClick={() => void handlePaste()}>
                    <ClipboardPaste className="h-4 w-4" />
                  </Button>
                )}
                {selectedFolderIds.size === 1 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={promptDeleteSelectedFolder}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <EDetailingSlideshow
        open={slideshowOpen}
        onOpenChange={setSlideshowOpen}
        items={openFolderId ? filesInView : unassignedMedia}
        startIndex={slideshowStart}
      />

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename folder</DialogTitle>
          </DialogHeader>
          <Input
            value={renameName}
            onChange={e => setRenameName(e.target.value)}
            placeholder="Folder name"
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void handleRenameFolder()} disabled={renameFolder.isPending}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New subfolder</DialogTitle>
          </DialogHeader>
          <Input
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            placeholder="Folder name"
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setNewFolderOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void handleCreateFolder()} disabled={createFolder.isPending}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteFolderId}
        onOpenChange={o => !o && setDeleteFolderId(null)}
        title="Delete folder?"
        description="Files inside will move to Not in any folder. Subfolders are removed."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          if (!deleteFolderId) return
          const target = folders.find(f => f.id === deleteFolderId)
          if (!canDeleteFolder(target)) {
            toast.error('Doctor categories cannot be deleted — turn off Active instead')
            setDeleteFolderId(null)
            return
          }
          void deleteFolder.mutateAsync(deleteFolderId).then(() => {
            toast.success('Folder deleted')
            if (openFolderId === deleteFolderId) setOpenFolderId(null)
            setDeleteFolderId(null)
            onRefresh()
          }).catch(e => toast.error(e instanceof Error ? e.message : 'Failed'))
        }}
      />
    </div>
  )
}
