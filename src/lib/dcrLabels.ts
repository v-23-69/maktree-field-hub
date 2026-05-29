export type ReportKind =
  | 'field'
  | 'leave'
  | 'sunday'
  | 'strike'
  | 'holiday'
  | 'meeting'
  | 'admin_day'

export type MeetingDurationType = 'full_day' | 'half_day'
export type MeetingTypeKind = 'cycle' | 'sales_review' | 'weekly'

export const MEETING_DURATION_OPTIONS: { value: MeetingDurationType; label: string }[] = [
  { value: 'full_day', label: 'Full day' },
  { value: 'half_day', label: 'Half day' },
]

export const MEETING_TYPE_OPTIONS: { value: MeetingTypeKind; label: string }[] = [
  { value: 'cycle', label: 'Cycle meeting' },
  { value: 'sales_review', label: 'Sales Review meeting' },
  { value: 'weekly', label: 'Weekly meeting' },
]

export function meetingTypeLabel(t: string | null | undefined): string {
  return MEETING_TYPE_OPTIONS.find(o => o.value === t)?.label ?? 'Meeting'
}

export function reportKindLabel(kind: string | null | undefined): string {
  switch (kind) {
    case 'field':
      return 'Field DCR'
    case 'leave':
      return 'Leave DCR'
    case 'sunday':
      return 'Sunday DCR'
    case 'strike':
      return 'Strike DCR'
    case 'holiday':
      return 'Holiday DCR'
    case 'meeting':
      return 'Meeting DCR'
    case 'admin_day':
      return 'Admin day'
    default:
      return 'DCR'
  }
}
