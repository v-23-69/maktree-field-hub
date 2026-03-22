export type UserRole = 'mr' | 'manager' | 'admin';

export interface User {
  id: string;
  full_name: string;
  employee_code: string;
  role: UserRole;
  email?: string;
  is_active: boolean;
  must_change_password: boolean;
  created_at: string;
}

export interface Area {
  id: string;
  name: string;
  is_active: boolean;
}

export interface SubArea {
  id: string;
  area_id: string;
  name: string;
  is_active: boolean;
  area?: Area;
}

export interface Doctor {
  id: string;
  name: string;
  code: string;
  speciality: string;
  sub_area_id: string;
  is_active: boolean;
  sub_area?: SubArea;
}

export interface DailyReport {
  id: string;
  mr_id: string;
  report_date: string;
  working_with_id: string | null;
  status: 'draft' | 'submitted';
  created_at: string;
  submitted_at: string | null;
  mr?: User;
  working_with?: User;
}

export interface ReportArea {
  id: string;
  report_id: string;
  area_id: string;
  area?: Area;
}

export interface ReportSubArea {
  id: string;
  report_id: string;
  sub_area_id: string;
  sub_area?: SubArea;
}

export interface DoctorVisit {
  id: string;
  report_id: string;
  doctor_id: string;
  chemist_name: string;
  created_at: string;
  doctor?: Doctor;
  products_promoted?: VisitProduct[];
  competitor_entries?: CompetitorEntry[];
  monthly_support?: MonthlySupport[];
}

export interface VisitProduct {
  id: string;
  visit_id: string;
  product_id: string;
  product?: Product;
}

export interface CompetitorEntry {
  id: string;
  visit_id: string;
  brand_name: string;
  quantity: number;
}

export interface MonthlySupport {
  id: string;
  visit_id: string;
  product_id: string;
  quantity: number;
  product?: Product;
}

export interface Product {
  id: string;
  name: string;
  is_active: boolean;
}

export interface MrSubAreaAccess {
  id: string;
  mr_id: string;
  sub_area_id: string;
  sub_area?: SubArea;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
