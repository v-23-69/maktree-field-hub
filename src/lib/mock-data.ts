import { User, Area, SubArea, Doctor, Product, DailyReport, DoctorVisit } from '@/types/database.types';

export const PRODUCTS: Product[] = [
  { id: '1', name: 'Maktree-D3', description: null, category: null, is_active: true, created_at: '2024-01-01' },
  { id: '2', name: 'CalciMax Plus', description: null, category: null, is_active: true, created_at: '2024-01-01' },
  { id: '3', name: 'IronBoost', description: null, category: null, is_active: true, created_at: '2024-01-01' },
  { id: '4', name: 'GastroEase', description: null, category: null, is_active: true, created_at: '2024-01-01' },
  { id: '5', name: 'NeuroVit B12', description: null, category: null, is_active: true, created_at: '2024-01-01' },
  { id: '6', name: 'CardioShield', description: null, category: null, is_active: true, created_at: '2024-01-01' },
  { id: '7', name: 'DermaGlow', description: null, category: null, is_active: true, created_at: '2024-01-01' },
  { id: '8', name: 'RespiClear', description: null, category: null, is_active: true, created_at: '2024-01-01' },
  { id: '9', name: 'FlexiJoint', description: null, category: null, is_active: true, created_at: '2024-01-01' },
];

export const MOCK_USERS: User[] = [
  { id: '1', auth_user_id: null, full_name: 'Rajesh Kumar', employee_code: 'MKT-MR-001', email: null, role: 'mr', is_active: true, must_change_password: false, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: '2', auth_user_id: null, full_name: 'Priya Sharma', employee_code: 'MKT-MR-002', email: null, role: 'mr', is_active: true, must_change_password: false, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: '3', auth_user_id: null, full_name: 'Amit Patel', employee_code: 'MKT-MR-003', email: null, role: 'mr', is_active: true, must_change_password: true, created_at: '2024-02-01', updated_at: '2024-02-01' },
  { id: '4', auth_user_id: null, full_name: 'Sunita Verma', employee_code: 'MKT-MGR-001', email: null, role: 'manager', is_active: true, must_change_password: false, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: '5', auth_user_id: null, full_name: 'Vikram Singh', employee_code: 'MKT-MGR-002', email: null, role: 'manager', is_active: true, must_change_password: false, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: '6', auth_user_id: null, full_name: 'Admin User', employee_code: 'MKT-ADM-001', email: null, role: 'admin', is_active: true, must_change_password: false, created_at: '2024-01-01', updated_at: '2024-01-01' },
];

export const MOCK_AREAS: Area[] = [
  { id: '1', name: 'North Delhi', code: 'ND', is_active: true, created_at: '2024-01-01' },
  { id: '2', name: 'South Delhi', code: 'SD', is_active: true, created_at: '2024-01-01' },
  { id: '3', name: 'East Delhi', code: 'ED', is_active: true, created_at: '2024-01-01' },
  { id: '4', name: 'Gurgaon', code: 'GGN', is_active: true, created_at: '2024-01-01' },
];

export const MOCK_SUB_AREAS: SubArea[] = [
  { id: '1', area_id: '1', name: 'Rohini', code: 'ND-ROH', is_active: true, created_at: '2024-01-01' },
  { id: '2', area_id: '1', name: 'Pitampura', code: 'ND-PIT', is_active: true, created_at: '2024-01-01' },
  { id: '3', area_id: '1', name: 'Model Town', code: 'ND-MT', is_active: true, created_at: '2024-01-01' },
  { id: '4', area_id: '2', name: 'Saket', code: 'SD-SAK', is_active: true, created_at: '2024-01-01' },
  { id: '5', area_id: '2', name: 'Hauz Khas', code: 'SD-HK', is_active: true, created_at: '2024-01-01' },
  { id: '6', area_id: '3', name: 'Laxmi Nagar', code: 'ED-LN', is_active: true, created_at: '2024-01-01' },
  { id: '7', area_id: '3', name: 'Preet Vihar', code: 'ED-PV', is_active: true, created_at: '2024-01-01' },
  { id: '8', area_id: '4', name: 'Sector 14', code: 'GGN-S14', is_active: true, created_at: '2024-01-01' },
  { id: '9', area_id: '4', name: 'DLF Phase 1', code: 'GGN-DLF1', is_active: true, created_at: '2024-01-01' },
];

export const MOCK_DOCTORS: Doctor[] = [
  { id: '1', full_name: 'Dr. Anand Mehta', doctor_code: 'DOC-001', speciality: 'General Physician', sub_area_id: '1', is_active: true, created_at: '2024-01-01' },
  { id: '2', full_name: 'Dr. Kavita Joshi', doctor_code: 'DOC-002', speciality: 'Orthopedic', sub_area_id: '1', is_active: true, created_at: '2024-01-01' },
  { id: '3', full_name: 'Dr. Ramesh Gupta', doctor_code: 'DOC-003', speciality: 'Cardiologist', sub_area_id: '2', is_active: true, created_at: '2024-01-01' },
  { id: '4', full_name: 'Dr. Neha Agarwal', doctor_code: 'DOC-004', speciality: 'Dermatologist', sub_area_id: '4', is_active: true, created_at: '2024-01-01' },
  { id: '5', full_name: 'Dr. Suresh Yadav', doctor_code: 'DOC-005', speciality: 'Neurologist', sub_area_id: '6', is_active: true, created_at: '2024-01-01' },
  { id: '6', full_name: 'Dr. Pooja Reddy', doctor_code: 'DOC-006', speciality: 'Pediatrician', sub_area_id: '8', is_active: true, created_at: '2024-01-01' },
];

export const MOCK_REPORTS: DailyReport[] = [
  { id: '1', mr_id: '1', manager_id: '4', report_date: '2026-03-20', status: 'submitted', created_at: '2026-03-20', submitted_at: '2026-03-20' },
  { id: '2', mr_id: '1', manager_id: null, report_date: '2026-03-19', status: 'submitted', created_at: '2026-03-19', submitted_at: '2026-03-19' },
  { id: '3', mr_id: '1', manager_id: '5', report_date: '2026-03-18', status: 'draft', created_at: '2026-03-18', submitted_at: null },
];

export const MOCK_VISITS: DoctorVisit[] = [
  {
    id: '1', report_id: '1', doctor_id: '1', chemist_name: 'MedPlus Pharmacy', created_at: '2026-03-20',
    products_promoted: [{ id: '1', visit_id: '1', product_id: '1' }, { id: '2', visit_id: '1', product_id: '3' }],
    competitor_entries: [{ id: '1', visit_id: '1', brand_name: 'Shelcal 500', quantity: 12 }],
    monthly_support: [{ id: '1', visit_id: '1', product_id: '1', quantity: 5 }],
  },
];
