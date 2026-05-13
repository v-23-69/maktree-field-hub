/** Categories MR/manager can pick for daily expense (Travel removed). */
export const EXPENSE_CATEGORY_OPTIONS = [
  'Food',
  'Stationery',
  'Printing',
  'Communication',
  'Other',
] as const

export type ExpenseCategoryOption = (typeof EXPENSE_CATEGORY_OPTIONS)[number]

export function expenseDescriptionForSave(
  category: ExpenseCategoryOption,
  otherDetail: string,
): string {
  const trimmed = otherDetail.trim()
  if (category === 'Other') {
    return trimmed || 'Other'
  }
  return trimmed || category
}
