import { useRef, type ReactNode } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'

type Props<T> = {
  items: T[]
  estimateSize?: number
  maxHeight?: string
  getKey: (item: T, index: number) => string
  renderItem: (item: T, index: number) => ReactNode
  /** Skip virtualization for small lists (less DOM overhead). */
  virtualizeThreshold?: number
}

export default function VirtualizedScrollList<T>({
  items,
  estimateSize = 72,
  maxHeight = 'min(60vh, 480px)',
  getKey,
  renderItem,
  virtualizeThreshold = 40,
}: Props<T>) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan: 8,
  })

  if (items.length <= virtualizeThreshold) {
    return (
      <div className="overflow-y-auto space-y-2" style={{ maxHeight }}>
        {items.map((item, index) => (
          <div key={getKey(item, index)}>{renderItem(item, index)}</div>
        ))}
      </div>
    )
  }

  return (
    <div ref={parentRef} className="overflow-y-auto" style={{ maxHeight }}>
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map(vRow => {
          const item = items[vRow.index]
          return (
            <div
              key={getKey(item, vRow.index)}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${vRow.start}px)`,
              }}
            >
              {renderItem(item, vRow.index)}
            </div>
          )
        })}
      </div>
    </div>
  )
}
