import { formatDisplayDateTime } from '@/lib/dateUtils'

export default function RequestTimestamps({
  sentAt,
  resolvedAt,
}: {
  sentAt?: string | null
  resolvedAt?: string | null
}) {
  if (!sentAt && !resolvedAt) return null
  return (
    <div className="text-[11px] text-muted-foreground space-y-0.5">
      {sentAt ? <p>Sent: {formatDisplayDateTime(sentAt)}</p> : null}
      {resolvedAt ? <p>Resolved: {formatDisplayDateTime(resolvedAt)}</p> : null}
    </div>
  )
}
