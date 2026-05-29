export type LeaveCategory = 'casual' | 'sick' | 'without_pay'

export const LEAVE_CATEGORY_OPTIONS: { value: LeaveCategory; label: string }[] = [
  { value: 'casual', label: 'Casual leave' },
  { value: 'sick', label: 'Sick leave' },
  { value: 'without_pay', label: 'Leave without pay' },
]

export function leaveCategoryLabel(cat: string | null | undefined): string {
  const c = (cat ?? 'casual') as LeaveCategory
  return LEAVE_CATEGORY_OPTIONS.find(o => o.value === c)?.label ?? 'Casual leave'
}
