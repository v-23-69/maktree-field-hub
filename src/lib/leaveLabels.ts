export type LeaveCategory = 'casual' | 'sick' | 'without_pay' | 'holiday'

export const LEAVE_CATEGORY_OPTIONS: { value: LeaveCategory; label: string }[] = [
  { value: 'casual', label: 'Casual leave' },
  { value: 'sick', label: 'Sick leave' },
  { value: 'without_pay', label: 'Leave without pay' },
]

const ALL_LEAVE_LABELS: { value: LeaveCategory; label: string }[] = [
  ...LEAVE_CATEGORY_OPTIONS,
  { value: 'holiday', label: 'Holiday' },
]

export function leaveCategoryLabel(cat: string | null | undefined): string {
  const c = (cat ?? 'casual') as LeaveCategory
  return ALL_LEAVE_LABELS.find(o => o.value === c)?.label ?? 'Casual leave'
}
