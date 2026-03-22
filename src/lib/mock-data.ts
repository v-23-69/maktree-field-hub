import { User, Area, SubArea, Doctor, Product, DailyReport, DoctorVisit } from '@/types/database.types';

export const PRODUCTS: Product[] = [
  { id: '1', name: 'Maktree-D3', is_active: true },
  { id: '2', name: 'CalciMax Plus', is_active: true },
  { id: '3', name: 'IronBoost', is_active: true },
  { id: '4', name: 'GastroEase', is_active: true },
  { id: '5', name: 'NeuroVit B12', is_active: true },
  { id: '6', name: 'CardioShield', is_active: true },
  { id: '7', name: 'DermaGlow', is_active: true },
  { id: '8', name: 'RespiClear', is_active: true },
  { id: '9', name: 'FlexiJoint', is_active: true },
];

export const MOCK_USERS: User[] = [
  { id: '1', full_name: 'Rajesh Kumar', employee_code: 'MKT-MR-001', role: 'mr', is_active: true, must_change_password: false, created_at: '2024-01-01' },
  { id: '2', full_name: 'Priya Sharma', employee_code: 'MKT-MR-002', role: 'mr', is_active: true, must_change_password: false, created_at: '2024-01-01' },
  { id: '3', full_name: 'Amit Patel', employee_code: 'MKT-MR-003', role: 'mr', is_active: true, must_change_password: true, created_at: '2024-02-01' },
  { id: '4', full_name: 'Sunita Verma', employee_code: 'MKT-MGR-001', role: 'manager', is_active: true, must_change_password: false, created_at: '2024-01-01' },
  { id: '5', full_name: 'Vikram Singh', employee_code: 'MKT-MGR-002', role: 'manager', is_active: true, must_change_password: false, created_at: '2024-01-01' },
  { id: '6', full_name: 'Admin User', employee_code: 'MKT-ADM-001', role: 'admin', is_active: true, must_change_password: false, created_at: '2024-01-01' },
];

export const MOCK_AREAS: Area[] = [
  { id: '1', name: 'North Delhi', is_active: true },
  { id: '2', name: 'South Delhi', is_active: true },
  { id: '3', name: 'East Delhi', is_active: true },
  { id: '4', name: 'Gurgaon', is_active: true },
];

export const MOCK_SUB_AREAS: SubArea[] = [
  { id: '1', area_id: '1', name: 'Rohini', is_active: true },
  { id: '2', area_id: '1', name: 'Pitampura', is_active: true },
  { id: '3', area_id: '1', name: 'Model Town', is_active: true },
  { id: '4', area_id: '2', name: 'Saket', is_active: true },
  { id: '5', area_id: '2', name: 'Hauz Khas', is_active: true },
  { id: '6', area_id: '3', name: 'Laxmi Nagar', is_active: true },
  { id: '7', area_id: '3', name: 'Preet Vihar', is_active: true },
  { id: '8', area_id: '4', name: 'Sector 14', is_active: true },
  { id: '9', area_id: '4', name: 'DLF Phase 1', is_active: true },
];

export const MOCK_DOCTORS: Doctor[] = [
  { id: '1', name: 'Dr. Anand Mehta', code: 'DOC-001', speciality: 'General Physician', sub_area_id: '1', is_active: true },
  { id: '2', name: 'Dr. Kavita Joshi', code: 'DOC-002', speciality: 'Orthopedic', sub_area_id: '1', is_active: true },
  { id: '3', name: 'Dr. Ramesh Gupta', code: 'DOC-003', speciality: 'Cardiologist', sub_area_id: '2', is_active: true },
  { id: '4', name: 'Dr. Neha Agarwal', code: 'DOC-004', speciality: 'Dermatologist', sub_area_id: '4', is_active: true },
  { id: '5', name: 'Dr. Suresh Yadav', code: 'DOC-005', speciality: 'Neurologist', sub_area_id: '6', is_active: true },
  { id: '6', name: 'Dr. Pooja Reddy', code: 'DOC-006', speciality: 'Pediatrician', sub_area_id: '8', is_active: true },
];

export const MOCK_REPORTS: DailyReport[] = [
  { id: '1', mr_id: '1', report_date: '2026-03-20', working_with_id: '4', status: 'submitted', created_at: '2026-03-20', submitted_at: '2026-03-20' },
  { id: '2', mr_id: '1', report_date: '2026-03-19', working_with_id: null, status: 'submitted', created_at: '2026-03-19', submitted_at: '2026-03-19' },
  { id: '3', mr_id: '1', report_date: '2026-03-18', working_with_id: '5', status: 'draft', created_at: '2026-03-18', submitted_at: null },
];

export const MOCK_VISITS: DoctorVisit[] = [
  {
    id: '1', report_id: '1', doctor_id: '1', chemist_name: 'MedPlus Pharmacy', created_at: '2026-03-20',
    products_promoted: [{ id: '1', visit_id: '1', product_id: '1' }, { id: '2', visit_id: '1', product_id: '3' }],
    competitor_entries: [{ id: '1', visit_id: '1', brand_name: 'Shelcal 500', quantity: 12 }],
    monthly_support: [{ id: '1', visit_id: '1', product_id: '1', quantity: 5 }],
  },
];
