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

export interface SubArea {
  id: string
  area_id: string
  name: string
  code: string
  is_active: boolean
  created_at: string
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
  created_at: string
}

export interface DailyReport {
  id: string
  mr_id: string
  manager_id: string | null
  report_date: string
  status: ReportStatus
  submitted_at: string | null
  created_at: string
  mr?: User
  manager?: User
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
  product?: Product
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

export interface UserProfile extends User {
  profile_photo_url: string | null
  dob: string | null
  aadhaar_number: string | null
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
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  manager_note: string | null
  resolved_at: string | null
  created_at: string
}

export interface StrikeReport {
  id: string
  mr_id: string
  strike_date: string
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

export interface ExpenseItem {
  id: string
  expense_report_id: string
  category: 'Travel' | 'Food' | 'Stationery' | 'Printing' | 'Communication' | 'Other'
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
  created_at: string
}

export interface TourProgramEntry {
  id: string
  tour_program_id: string
  work_date: string
  sub_area_id: string | null
  working_with: string | null
  day_type: 'working' | 'sunday' | 'holiday' | 'leave' | 'strike'
  notes: string | null
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
