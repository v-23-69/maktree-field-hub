/** Explicit doctor columns for list queries (avoids select * overfetch). */
export const DOCTOR_LIST_COLUMNS =
  'id, sub_area_id, doctor_code, full_name, speciality, is_active, master_list_complete, monthly_visit_target, mobile, qualification, address, city, created_at' as const

export const DOCTOR_LIST_WITH_SUBAREA =
  `${DOCTOR_LIST_COLUMNS}, sub_area:sub_areas(id, name, code, area_id, is_active, area:areas(id, name, code))` as const

export const DOCTOR_DETAIL_COLUMNS =
  'id, sub_area_id, doctor_code, full_name, speciality, is_active, master_list_complete, monthly_visit_target, mobile, qualification, address, city, birthday, marriage_anniversary, visit_frequency, created_at' as const
