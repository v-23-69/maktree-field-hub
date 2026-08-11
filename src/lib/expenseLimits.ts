/** Default daily expense allotment for medical representatives (INR). */
export const MR_DAILY_EXPENSE_LIMIT = 200

/** Default daily expense allotment for managers filing their own expense (INR). */
export const MANAGER_DAILY_EXPENSE_LIMIT = 300

export function dailyExpenseLimitForRole(role: string | null | undefined): number {
  return role === 'manager' || role === 'admin' ? MANAGER_DAILY_EXPENSE_LIMIT : MR_DAILY_EXPENSE_LIMIT
}
