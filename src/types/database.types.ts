export type UserRole = 'mr' | 'manager' | 'admin'
export type ReportStatus = 'draft' | 'submitted'

export interface User {
  id: string
  auth_user_id: string | null
  employee_code: string
  full_name: string
  email: string | null
  role: UserRole
  must_change_password: boolean
  is_active: boolean
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
  is_active: boolean
  created_at: string
  sub_area?: SubArea
}

export interface Chemist {
  id: string
  sub_area_id: string
  name: string
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

// Legacy aliases used by mock-data and existing UI components
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
  isLoading: boolean
  isAuthenticated: boolean
}
