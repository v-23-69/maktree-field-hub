/** Explicit PostgREST column lists (hot paths — avoids select * overfetch). */

export const USER_PROFILE_COLUMNS =
  'id, auth_user_id, employee_code, full_name, email, role, is_active, profile_photo_url, dob, aadhaar_number, pan_number, address, city, state, pincode, mobile, emergency_contact_name, emergency_contact_mobile, joining_date, designation, profile_complete_pct, is_blocked, block_reason, blocked_at, blocked_by, created_at' as const

export const EXPENSE_REPORT_COLUMNS =
  'id, mr_id, report_date, daily_limit, total_used, status, submitted_at, created_at' as const

export const EXPENSE_ITEM_COLUMNS =
  'id, expense_report_id, category, description, amount, created_at' as const

export const TARGET_COLUMNS =
  'id, mr_id, product_id, sub_area_id, target_qty, achieved_qty, start_date, end_date, set_by, created_at' as const

export const TARGET_ACHIEVEMENT_COLUMNS =
  'target_id, mr_id, mr_name, mr_code, product_name, sub_area, target_qty, start_date, end_date, achieved_qty, achievement_pct' as const

export const DCR_DAILY_STATUS_COLUMNS =
  'mr_id, check_date, tour_program_done, dcr_done, expense_done, is_working_day' as const

export const EXPENSE_MONTHLY_SUMMARY_COLUMNS =
  'mr_id, month, total_allotted, total_used' as const

export const EXPENSE_BY_CATEGORY_COLUMNS =
  'mr_id, month, category, total_amount' as const
