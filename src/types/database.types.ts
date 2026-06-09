export type UserRole = 'mr' | 'manager' | 'admin'
export type ReportStatus = 'draft' | 'submitted'

export interface User {
  id: string
  auth_user_id: string | null
  employee_code: string
  full_name: string
  email: string | null
  role: UserRole
  is_active: boolean
  profile_photo_url?: string | null
  dob?: string | null
  aadhaar_number?: string | null
  pan_number?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  pincode?: string | null
  mobile?: string | null
  emergency_contact_name?: string | null
  emergency_contact_mobile?: string | null
  joining_date?: string | null
  designation?: string | null
  profile_complete_pct?: number
  is_blocked?: boolean
  block_reason?: string | null
  blocked_at?: string | null
  blocked_by?: string | null
  is_resigned?: boolean
  resigned_at?: string | null
  resigned_by?: string | null
  is_paused?: boolean
  paused_at?: string | null
  paused_by?: string | null
  pause_reason?: string | null
  created_at: string
  updated_at: string
}

export interface Area {
  id: string
  name: string
  code: string
  is_active: boolean
  created_at: string
}

export interface Stockist {
  id: string
  area_id: string
  name: string
  is_active: boolean
  created_at: string
  created_by?: string | null
}

export interface StockistMeet {
  id: string
  user_id: string
  meet_date: string
  meet_time?: string | null
  area_id: string
  stockist_id: string
  notes?: string | null
  created_at: string
  updated_at: string
  stockist?: { id: string; name: string } | null
  area?: { id: string; name: string } | null
}

export interface SubArea {
  id: string
  area_id: string
  name: string
  code: string
  is_active: boolean
  created_at: string
  is_manager_custom?: boolean
  area?: Area
}

export interface Doctor {
  id: string
  sub_area_id: string
  doctor_code: string
  full_name: string
  speciality: string | null
  qualification: string | null
  address: string | null
  city: string | null
  mobile: string | null
  birthday: string | null
  marriage_anniversary: string | null
  visit_frequency: 'weekly' | 'fortnightly' | 'monthly' | null
  /** Target completed field visits per calendar month (MR-owned doctors). */
  monthly_visit_target?: number
  master_list_complete: boolean
  is_active: boolean
  created_at: string
  sub_area?: SubArea
}

export interface Chemist {
  id: string
  sub_area_id: string
  name: string
  address: string | null
  city: string | null
  mobile: string | null
  /** Optional proprietor / owner name for this outlet. */
  owner_name?: string | null
  /** Optional owner contact number. */
  owner_contact?: string | null
  is_active: boolean
  created_at: string
}

export interface ChemistDoctorMap {
  id: string
  chemist_id: string
  doctor_id: string
  created_at: string
  chemist?: Chemist
}

export interface Product {
  id: string
  name: string
  description: string | null
  category: string | null
  is_active: boolean
  ptr: number
  created_at: string
}

export interface DailyReport {
  id: string
  mr_id: string
  manager_id: string | null
  working_with_ids: string[]
  report_date: string
  status: ReportStatus
  submitted_at: string | null
  created_at: string
  manager_dcr_origin?: 'standard' | 'custom' | 'import' | 'mixed' | null
  report_kind?:
    | 'field'
    | 'leave'
    | 'sunday'
    | 'strike'
    | 'holiday'
    | 'meeting'
    | 'admin_day'
    | 'stockist_visit'
    | 'sales_closing'
  leave_dcr_category?: 'casual' | 'sick' | 'without_pay' | null
  leave_dcr_remark?: string | null
  meeting_duration_type?: 'full_day' | 'half_day' | null
  meeting_start_time?: string | null
  meeting_end_time?: string | null
  meeting_type?: 'cycle' | 'sales_review' | 'weekly' | null
  meeting_attendee_ids?: string[]
  meeting_notes?: string | null
  admin_day_start_time?: string | null
  admin_day_end_time?: string | null
  admin_day_notes?: string | null
  stockist_id?: string | null
  is_late_submission?: boolean
  mr?: User
  manager?: User
}

/** Pending manager import when MR submitted DCR with working-with manager(s). */
export interface DcrManagerImport {
  id: string
  mr_report_id: string
  manager_id: string
  mr_id: string
  report_date: string
  status: 'pending' | 'completed' | 'dismissed'
  manager_report_id: string | null
  created_at: string
  completed_at: string | null
}

export interface ReportVisit {
  id: string
  report_id: string
  doctor_id: string
  chemist_id: string | null
  visited_at: string
  doctor?: Doctor
  chemist?: Chemist
  promoted_products?: PromotedProduct[]
  competitor_entries?: CompetitorEntry[]
  monthly_support_entries?: MonthlySupportEntry[]
}

export interface PromotedProduct {
  id: string
  visit_id: string
  product_id: string
  product?: Product
}

export interface CompetitorEntry {
  id: string
  visit_id: string
  brand_name: string
  quantity: number
}

export interface MonthlySupportEntry {
  id: string
  visit_id: string
  product_id: string
  quantity: number
  /** Saved line total (INR) at submit time; PTR is not exposed in UI. */
  amount_inr?: number | null
  product?: Product
}

export interface DoctorChemistPayload {
  name: string
  owner_name: string | null
  owner_contact: string | null
}

/** MR requests adding a doctor; manager approves → doctor created. */
export interface DoctorAddRequest {
  id: string
  mr_id: string
  manager_id: string | null
  sub_area_id: string
  status: 'pending' | 'approved' | 'rejected'
  payload: {
    doctor: {
      full_name: string
      speciality: string
      qualification?: string | null
      address?: string | null
      city?: string | null
      mobile?: string | null
      birthday?: string | null
      marriage_anniversary?: string | null
      visit_frequency?: 'weekly' | 'fortnightly' | 'monthly' | null
      monthly_visit_target?: number
    }
    chemists?: DoctorChemistPayload[]
  }
  doctor_id: string | null
  manager_note: string | null
  approved_by: string | null
  created_at: string
  resolved_at: string | null
  mr?: Pick<User, 'id' | 'full_name' | 'employee_code'>
  sub_area?: Pick<SubArea, 'id' | 'name' | 'code'> & { area?: Pick<Area, 'id' | 'name'> }
}

export interface UserNotification {
  id: string
  user_id: string
  kind: string
  title: string
  body: string
  url: string
  read_at: string | null
  metadata: Record<string, unknown>
  created_at: string
}

/** MR requests removal of a doctor; manager approves → doctor deactivated. */
export interface DoctorDeletionRequest {
  id: string
  mr_id: string
  doctor_id: string
  manager_id: string | null
  status: 'pending' | 'approved' | 'rejected'
  reason: string | null
  manager_note: string | null
  approved_by: string | null
  created_at: string
  resolved_at: string | null
  mr?: Pick<User, 'id' | 'full_name' | 'employee_code'>
  doctor?: Pick<Doctor, 'id' | 'full_name' | 'speciality' | 'sub_area_id'>
}

export interface MrManagerMap {
  id: string
  mr_id: string
  manager_id: string
  assigned_at: string
  mr?: User
  manager?: User
}

export interface MrSubAreaAccess {
  id: string
  mr_id: string
  sub_area_id: string
  sub_area?: SubArea
}

// Form types (used in React Hook Form)
export interface DoctorVisitFormData {
  doctor_id: string
  chemist_name: string
  promoted_product_ids: string[]
  competitor_entries: { brand_name: string; quantity: number }[]
  monthly_support_entries: { product_id: string; quantity: number }[]
}

export interface DailyReportFormData {
  report_date: string
  manager_id: string
  selected_sub_area_ids: string[]
  visits: DoctorVisitFormData[]
}

// Legacy / alternate shapes used by report UI
export interface DoctorVisit {
  id: string
  report_id: string
  doctor_id: string
  chemist_name: string
  created_at: string
  doctor?: Doctor
  products_promoted?: VisitProduct[]
  competitor_entries?: CompetitorEntry[]
  monthly_support?: MonthlySupport[]
}

export interface VisitProduct {
  id: string
  visit_id: string
  product_id: string
  product?: Product
}

export interface MonthlySupport {
  id: string
  visit_id: string
  product_id: string
  quantity: number
  amount_inr?: number | null
  product?: Product
}

export interface ReportArea {
  id: string
  report_id: string
  area_id: string
  area?: Area
}

export interface ReportSubArea {
  id: string
  report_id: string
  sub_area_id: string
  sub_area?: SubArea
}

export interface AuthState {
  user: User | null
  /**
   * True only while the initial Supabase session read is in progress (short; does not wait on profile).
   */
  isLoading: boolean
  isAuthenticated: boolean
  /** True once the first session check has finished — safe to render the login form. */
  authReady: boolean
  /** Supabase has a JWT but `public.users` profile is not loaded yet (e.g. returning visit). */
  isProfileLoading: boolean
}

export interface DoctorAlert {
  doctor_id: string
  doctor_name: string
  alert_type: 'birthday' | 'anniversary'
  alert_date: string
  days_until: number
  sub_area: string
}

export interface ReportBlockStatus {
  is_blocked: boolean
  missed_dates: string[]
  has_pending_request: boolean
}

export interface AllowedReportDate {
  report_date: string
  already_submitted: boolean
  /** 'working' | 'leave' | 'holiday' | 'strike' | 'sunday' from get_allowed_report_dates */
  day_type?: string
  /** True when date was opened via manager-approved late backfill slot */
  is_late_slot?: boolean
}

export interface LateDcrFillRequest {
  id: string
  mr_id: string
  mr_full_name?: string
  manager_id: string
  requested_dates: string[]
  status: 'pending' | 'approved' | 'rejected'
  manager_comment: string | null
  reviewed_at: string | null
  created_at: string
}

export interface ReportUnlockRequest {
  id: string
  mr_id: string
  manager_id: string | null
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  manager_comment: string | null
  requested_date: string
  resolved_at: string | null
  created_at: string
}

export interface ReportIssue {
  id: string
  report_id: string
  mr_id: string
  issue_text: string
  report_date: string
  status: 'open' | 'reviewed' | 'resolved'
  manager_note: string | null
  created_at: string
}

export interface Target {
  id: string
  mr_id: string
  product_id: string
  sub_area_id: string | null
  target_qty: number
  achieved_qty: number
  start_date: string
  end_date: string
  set_by: string
  created_at: string
}

export interface TargetAchievement {
  target_id: string
  mr_id: string
  mr_name: string
  mr_code: string
  product_name: string
  sub_area: string | null
  target_qty: number
  start_date: string
  end_date: string
  achieved_qty: number
  achievement_pct: number
}

export interface MasterListCompletion {
  mr_id: string
  mr_name: string
  area: string
  sub_area: string
  sub_area_id: string
  total_doctors: number
  complete_doctors: number
  incomplete_doctors: number
  completion_pct: number
}

/** Active employee with birthday today (IST), from `get_employees_birthday_today`. */
export interface EmployeeBirthdayToday {
  user_id: string
  full_name: string
  role: string
  designation: string | null
  profile_photo_url: string | null
}

/** Birthday wish shown on the recipient's dashboard today. */
export interface BirthdayWishRow {
  id: string
  message: string
  created_at: string
  sender_id: string
  sender_name: string
  sender_role: string
  sender_photo_url: string | null
}

export interface UserProfile extends User {
  profile_photo_url: string | null
  dob: string | null
  aadhaar_number: string | null
  pan_number: string | null
  address: string | null
  city: string | null
  state: string | null
  pincode: string | null
  mobile: string | null
  emergency_contact_name: string | null
  emergency_contact_mobile: string | null
  joining_date: string | null
  designation: string | null
  profile_complete_pct: number
  is_blocked: boolean
  block_reason: string | null
}

export interface Holiday {
  id: string
  name: string
  holiday_date: string
  holiday_type: 'national' | 'company'
  created_by: string
  created_at: string
}

export interface MrHoliday {
  id: string
  mr_id: string
  holiday_id: string
  assigned_by: string
  year: number
  counts_as_leave: boolean
  holiday?: Holiday
}

export interface LeaveRequest {
  id: string
  mr_id: string
  manager_id: string | null
  leave_date: string
  leave_type: 'full' | 'half_morning' | 'half_afternoon'
  leave_category?: 'casual' | 'sick' | 'without_pay'
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  manager_note: string | null
  resolved_at: string | null
  approved_by: string | null
  created_at: string
  mr?: Pick<User, 'id' | 'full_name' | 'employee_code'>
  approver?: Pick<User, 'id' | 'full_name'> | null
}

export interface StrikeReport {
  id: string
  mr_id: string
  strike_date: string
  reason?: string | null
  created_at: string
}

export interface ManagerLeaveEntry {
  id: string
  manager_id: string
  leave_date: string
  leave_category: 'casual' | 'sick'
  remark: string | null
  created_at: string
}

export interface ExpenseReport {
  id: string
  mr_id: string
  report_date: string
  daily_limit: number
  total_used: number
  status: 'draft' | 'submitted'
  submitted_at: string | null
  created_at: string
}

export type ExpenseItemCategory =
  | 'Food'
  | 'Stationery'
  | 'Printing'
  | 'Communication'
  | 'Other'
  /** Legacy rows only */
  | 'Travel'

export interface ExpenseItem {
  id: string
  expense_report_id: string
  category: ExpenseItemCategory
  description: string
  amount: number
  created_at: string
}

export interface TourProgram {
  id: string
  mr_id: string
  month: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  manager_id: string | null
  manager_note: string | null
  is_late: boolean
  approved_at: string | null
  submitted_at: string | null
  /** Increments when MR unlocks a submitted/approved TP for re-approval, or when a manager saves edits on an approved self TP. */
  edit_count: number
  created_at: string
}

export interface TourProgramDeletionRequest {
  id: string
  tour_program_id: string | null
  mr_id: string
  status: 'pending' | 'approved' | 'rejected'
  manager_note: string | null
  resolved_by: string | null
  created_at: string
  resolved_at: string | null
}

export interface TourProgramEntry {
  id: string
  tour_program_id: string
  work_date: string
  sub_area_id: string | null
  working_with: string | null
  working_with_ids: string[]
  day_type: 'working' | 'sunday' | 'holiday' | 'leave' | 'strike'
  notes: string | null
}

export interface TpStatus {
  current_month: string
  current_month_tp_status: 'not_created' | 'draft' | 'submitted' | 'approved' | 'rejected'
  current_month_tp_exists: boolean
  /** True when current month TP row exists with status approved (preferred over parsing status). */
  current_month_tp_approved?: boolean
  /** True when user has at least one sub-area in mr_sub_area_access. */
  has_sub_area_access?: boolean
  next_month: string
  next_month_tp_status: 'not_created' | 'draft' | 'submitted' | 'approved' | 'rejected'
  next_month_tp_exists: boolean
  deadline_date: string
  days_to_deadline: number
  is_overdue: boolean
}

export interface TodayTpPlan {
  work_date: string
  sub_area_id: string
  sub_area_name: string
  area_id: string
  area_name: string
  working_with_ids: string[]
  day_type: string
  notes: string | null
  tp_status: string
}

export interface BlockComplaint {
  id: string
  user_id: string
  complaint: string
  status: 'pending' | 'approved' | 'rejected'
  admin_note: string | null
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
}

export interface DcrDailyStatus {
  mr_id: string
  check_date: string
  tour_program_done: boolean
  dcr_done: boolean
  expense_done: boolean
  is_working_day: boolean
}

export interface DcrMonthlySummary {
  mr_id: string
  mr_name: string
  month: string
  total_working_days: number
  dcr_submitted_days: number
  leave_days: number
  holiday_days: number
  strike_days: number
  holidays_used_this_year: number
}
