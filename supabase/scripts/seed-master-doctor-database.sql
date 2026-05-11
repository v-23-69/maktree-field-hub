-- =============================================================
-- MASTER DOCTOR DATABASE SEED
-- Generated from Master_Doctor_Database.xlsx
-- Territories: PCMC, Narayangaon
-- MRs: Arun Khadul, Ashok Mulik, Dheeraj Kande
-- Total Doctors: 453
-- Total Sub-Areas: 32
-- =============================================================

BEGIN;

-- ─────────────────────────────────────────────
-- 1. CLEAN OLD DATA (areas, sub_areas, doctors, access)
--    This removes fragmented/test data and starts fresh.
-- ─────────────────────────────────────────────

-- Remove child data first (respects FK order):
-- promoted_products / competitor_entries / monthly_support_entries
-- → report_visits → daily_reports
-- → chemist_doctor_map → chemists
-- → doctors → mr_sub_area_access → sub_areas → areas
DELETE FROM public.promoted_products;
DELETE FROM public.competitor_entries;
DELETE FROM public.monthly_support_entries;
DELETE FROM public.report_visits;
DELETE FROM public.daily_reports;
DELETE FROM public.chemist_doctor_map;
DELETE FROM public.chemists;
DELETE FROM public.mr_sub_area_access;
DELETE FROM public.doctors;
DELETE FROM public.sub_areas;
DELETE FROM public.areas;

-- ─────────────────────────────────────────────
-- 2. INSERT AREAS (Territories)
-- ─────────────────────────────────────────────

INSERT INTO public.areas (id, name, code, is_active, created_at)
VALUES (gen_random_uuid(), 'PCMC', 'PCMC', true, now())
ON CONFLICT DO NOTHING;

INSERT INTO public.areas (id, name, code, is_active, created_at)
VALUES (gen_random_uuid(), 'Narayangaon', 'NARAYANGAON', true, now())
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────
-- 3. INSERT SUB-AREAS
-- ─────────────────────────────────────────────

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'PCMC' LIMIT 1),
  'Hinjewadi+Marunji+Maan',
  'HINJEWADI',
  true,
  now()
)
ON CONFLICT DO NOTHING;

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'PCMC' LIMIT 1),
  'Kalewadi + Aditya Birla',
  'KALEWADI',
  true,
  now()
)
ON CONFLICT DO NOTHING;

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'PCMC' LIMIT 1),
  'Aundh + Baner',
  'AUNDH-BANER',
  true,
  now()
)
ON CONFLICT DO NOTHING;

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'PCMC' LIMIT 1),
  'Dehuroad + Somatne Phata + Talegaon',
  'DEHUROAD-SOMATNE',
  true,
  now()
)
ON CONFLICT DO NOTHING;

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'PCMC' LIMIT 1),
  'Nigdi + Akurdi',
  'NIGDI-AKURDI',
  true,
  now()
)
ON CONFLICT DO NOTHING;

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'PCMC' LIMIT 1),
  'Pimpri + Neharu Nagar',
  'PIMPRI-NEHARU-NGR',
  true,
  now()
)
ON CONFLICT DO NOTHING;

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'PCMC' LIMIT 1),
  'Vadgaon  + Takve  + Kamshet',
  'VADGAON-KAMSHET',
  true,
  now()
)
ON CONFLICT DO NOTHING;

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'PCMC' LIMIT 1),
  'Dehugaon + Soamatne Phata',
  'DEHUGAON',
  true,
  now()
)
ON CONFLICT DO NOTHING;

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'PCMC' LIMIT 1),
  'Thergaon  + Ravet + Wakad',
  'THERGAON-RAVET',
  true,
  now()
)
ON CONFLICT DO NOTHING;

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'PCMC' LIMIT 1),
  'Chinchwad',
  'CHINCHWAD',
  true,
  now()
)
ON CONFLICT DO NOTHING;

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'Narayangaon' LIMIT 1),
  'Alephata',
  'ALEPHATA',
  true,
  now()
)
ON CONFLICT DO NOTHING;

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'Narayangaon' LIMIT 1),
  'Manchar',
  'MANCHAR',
  true,
  now()
)
ON CONFLICT DO NOTHING;

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'Narayangaon' LIMIT 1),
  'Narayangaon',
  'NARAYANGAON',
  true,
  now()
)
ON CONFLICT DO NOTHING;

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'Narayangaon' LIMIT 1),
  'Rajguru Nagar',
  'RAJGURU-NAGAR',
  true,
  now()
)
ON CONFLICT DO NOTHING;

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'Narayangaon' LIMIT 1),
  'Chakan',
  'CHAKAN',
  true,
  now()
)
ON CONFLICT DO NOTHING;

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'Narayangaon' LIMIT 1),
  'Mahalunge + Sudumbre',
  'MAHALUNGE-SUDUMBRE',
  true,
  now()
)
ON CONFLICT DO NOTHING;

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'Narayangaon' LIMIT 1),
  'Nighoje + Jawala',
  'NIGHOJE-JAWALA',
  true,
  now()
)
ON CONFLICT DO NOTHING;

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'Narayangaon' LIMIT 1),
  'Umbraj',
  'UMBRAJ',
  true,
  now()
)
ON CONFLICT DO NOTHING;

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'Narayangaon' LIMIT 1),
  'Otur',
  'OTUR',
  true,
  now()
)
ON CONFLICT DO NOTHING;

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'Narayangaon' LIMIT 1),
  'Junnar',
  'JUNNAR',
  true,
  now()
)
ON CONFLICT DO NOTHING;

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'Narayangaon' LIMIT 1),
  'Ghodegaon + Shiroli',
  'GHODEGAON-SHIROLI',
  true,
  now()
)
ON CONFLICT DO NOTHING;

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'PCMC' LIMIT 1),
  'Alandi',
  'ALANDI',
  true,
  now()
)
ON CONFLICT DO NOTHING;

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'PCMC' LIMIT 1),
  'Bhoasri -I',
  'BHOSARI-I',
  true,
  now()
)
ON CONFLICT DO NOTHING;

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'PCMC' LIMIT 1),
  'Chikhali -I',
  'CHIKHALI-I',
  true,
  now()
)
ON CONFLICT DO NOTHING;

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'PCMC' LIMIT 1),
  'Moshi',
  'MOSHI',
  true,
  now()
)
ON CONFLICT DO NOTHING;

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'PCMC' LIMIT 1),
  'Bhosari -II',
  'BHOSARI-II',
  true,
  now()
)
ON CONFLICT DO NOTHING;

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'PCMC' LIMIT 1),
  'Dighi + Bopkhel',
  'DIGHI-BOPKHEL',
  true,
  now()
)
ON CONFLICT DO NOTHING;

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'PCMC' LIMIT 1),
  'Shau Nagar + Jadhavwadi',
  'SHAHU-NGR-J-WADI',
  true,
  now()
)
ON CONFLICT DO NOTHING;

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'PCMC' LIMIT 1),
  'Khadki + Dapodi',
  'KHADKI-DAPODI',
  true,
  now()
)
ON CONFLICT DO NOTHING;

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'PCMC' LIMIT 1),
  'Sangvi + Kasarwadi',
  'SANGVI',
  true,
  now()
)
ON CONFLICT DO NOTHING;

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'PCMC' LIMIT 1),
  'Pimple Saudagar+ Pimple Nilakh',
  'PIMPLE-SUDA-NILAKH',
  true,
  now()
)
ON CONFLICT DO NOTHING;

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'PCMC' LIMIT 1),
  'Chikhali -II',
  'CHIKHALI-II',
  true,
  now()
)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────
-- 4. INSERT DOCTORS
-- ─────────────────────────────────────────────

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Hinjewadi+Marunji+Maan' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0001',
  'Atul Phavde',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Hinjewadi+Marunji+Maan' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0002',
  'Amol Navale',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Hinjewadi+Marunji+Maan' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0003',
  'Amol Gholap',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Hinjewadi+Marunji+Maan' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0004',
  'Vikas Patil',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Hinjewadi+Marunji+Maan' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0005',
  'Snehal Desai',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Hinjewadi+Marunji+Maan' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0006',
  'Navnath Jadhav',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Hinjewadi+Marunji+Maan' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0007',
  'Vijay Badgujar',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Hinjewadi+Marunji+Maan' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0008',
  'Pradip Gavane',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Hinjewadi+Marunji+Maan' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0009',
  'Madhavi Mithe',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Hinjewadi+Marunji+Maan' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0010',
  'Gunjan Patil',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Hinjewadi+Marunji+Maan' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0011',
  'Prashant Nadhe',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Hinjewadi+Marunji+Maan' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0012',
  'Bhupesh Doiphode',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Hinjewadi+Marunji+Maan' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0013',
  'Aakash Kawaste',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Hinjewadi+Marunji+Maan' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0014',
  'Naresh Sonar',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Hinjewadi+Marunji+Maan' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0015',
  'Shailesh Zaware',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Kalewadi + Aditya Birla' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0016',
  'K S Ghosh',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Kalewadi + Aditya Birla' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0017',
  'Amol Wadi',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Kalewadi + Aditya Birla' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0018',
  'Sham Mahajan',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Kalewadi + Aditya Birla' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0019',
  'Shakur Pathan',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Kalewadi + Aditya Birla' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0020',
  'Mrudula Kulkarni',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Kalewadi + Aditya Birla' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0021',
  'Patibha Devare',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Kalewadi + Aditya Birla' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0022',
  'Priya Diwan',
  'PED',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Kalewadi + Aditya Birla' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0023',
  'Viajay Gujar',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Kalewadi + Aditya Birla' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0024',
  'Swapnil Bhise',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Kalewadi + Aditya Birla' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0025',
  'Sushila Netravati',
  'GYNI',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Kalewadi + Aditya Birla' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0026',
  'Kailas Jurol',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Kalewadi + Aditya Birla' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0027',
  'Abhijit Lonari',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Kalewadi + Aditya Birla' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0028',
  'Akash Tatiya',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Kalewadi + Aditya Birla' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0029',
  'Rajendra Barge',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Aundh + Baner' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0030',
  'Rajendra Latkar',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Aundh + Baner' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0031',
  'Anand Surana',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Aundh + Baner' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0032',
  'Shashank Bahere',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Aundh + Baner' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0033',
  'Sahilesh Madhekar',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Aundh + Baner' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0034',
  'Atul Adkar',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Aundh + Baner' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0035',
  'Shrikant Dalal',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Aundh + Baner' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0036',
  'Niranjan Dhekane',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Aundh + Baner' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0037',
  'Pramod Jog',
  'PED',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Aundh + Baner' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0038',
  'Rahul Sulakshane',
  'PED',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Aundh + Baner' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0039',
  'Suhas Udgirkar',
  'GASTRO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Aundh + Baner' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0040',
  'Chandrakant Dixit',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Aundh + Baner' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0041',
  'Sameep Bhujbal',
  'GYNI',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Aundh + Baner' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0042',
  'Shivhar Sonawane',
  'PED',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Aundh + Baner' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0043',
  'Aniruddha Deshmukh',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Aundh + Baner' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0044',
  'Sumit Magar',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Aundh + Baner' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0045',
  'Vishwajit Chauhan',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Dehuroad + Somatne Phata + Talegaon' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0046',
  'Nitin Mahajan',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Dehuroad + Somatne Phata + Talegaon' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0047',
  'Rajendra Karamlekar',
  'PED',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Dehuroad + Somatne Phata + Talegaon' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0048',
  'Hitendra Ahirrao',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Dehuroad + Somatne Phata + Talegaon' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0049',
  'Rohit Kanse',
  'PHY',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Dehuroad + Somatne Phata + Talegaon' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0050',
  'Sandeep Chauhan',
  'PED',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Dehuroad + Somatne Phata + Talegaon' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0051',
  'Varada Kulkarni',
  'GYNI',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Dehuroad + Somatne Phata + Talegaon' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0052',
  'Rohit Suryawanshi',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Dehuroad + Somatne Phata + Talegaon' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0053',
  'Sudip Rasal',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Dehuroad + Somatne Phata + Talegaon' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0054',
  'Leena Gunjal',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Dehuroad + Somatne Phata + Talegaon' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0055',
  'Prakash Patil',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Dehuroad + Somatne Phata + Talegaon' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0056',
  'Rahul Badhe',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Dehuroad + Somatne Phata + Talegaon' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0057',
  'Mahendra Chauhan',
  'PED',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Dehuroad + Somatne Phata + Talegaon' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0058',
  'Shrikant Waghole',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Dehuroad + Somatne Phata + Talegaon' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0059',
  'Shrikant Patil',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Dehuroad + Somatne Phata + Talegaon' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0060',
  'Nikhil Mohokar (Kivale Bus Stop)',
  'OTRHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Dehuroad + Somatne Phata + Talegaon' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0061',
  'Veena Shah',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Dehuroad + Somatne Phata + Talegaon' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0062',
  'Manoj Kumar',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Nigdi + Akurdi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0063',
  'Sonal Jadhav',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Nigdi + Akurdi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0064',
  'Nilam Dhamale',
  'PED',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Nigdi + Akurdi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0065',
  'Shivdas Patil',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Nigdi + Akurdi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0066',
  'Satyajit Patil',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Nigdi + Akurdi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0067',
  'Aparna Bankhele',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Nigdi + Akurdi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0068',
  'Rajan Chuhan',
  'PED',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Nigdi + Akurdi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0069',
  'Mohan Rajapure',
  'PED',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Nigdi + Akurdi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0070',
  'Ravindra Kadam',
  'PED',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Nigdi + Akurdi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0071',
  'Taruna Unnarkar',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Nigdi + Akurdi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0072',
  'Yogini Kokate',
  'PED',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Nigdi + Akurdi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0073',
  'Neelam Kulkarni (National Medical)',
  'PED',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Nigdi + Akurdi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0074',
  'Saurabh Gaikwad (Dhanvantari Hospi) 7.00pm',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Nigdi + Akurdi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0075',
  'Ashish Dongre (Globle Hospi Ravet)',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Nigdi + Akurdi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0076',
  'Sushil Karade',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Nigdi + Akurdi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0077',
  'Prafulla Pachpande',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Nigdi + Akurdi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0078',
  'Hemant Patil ( Akurdi)',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Pimpri + Neharu Nagar' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0079',
  'Sanjay Wagh',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Pimpri + Neharu Nagar' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0080',
  'Rajiv Shinkar',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Pimpri + Neharu Nagar' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0081',
  'M K Ramnani',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Pimpri + Neharu Nagar' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0082',
  'Chandrahans Parspatki',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Pimpri + Neharu Nagar' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0083',
  'Suyash Sangvi',
  'PED',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Pimpri + Neharu Nagar' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0084',
  'K J Mahajan',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Pimpri + Neharu Nagar' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0085',
  'Swati Langhi',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Pimpri + Neharu Nagar' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0086',
  'V B Lohade',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Pimpri + Neharu Nagar' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0087',
  'M R Khan',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Pimpri + Neharu Nagar' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0088',
  'Lubna Patel',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Pimpri + Neharu Nagar' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0089',
  'Sunil Sanghavi (Eve)',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Pimpri + Neharu Nagar' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0090',
  'Shahaji Chauhan (Eve)',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Pimpri + Neharu Nagar' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0091',
  'Tanjila Khan',
  'GYNI',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Pimpri + Neharu Nagar' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0092',
  'B. R. Rathani',
  'PROCTO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Vadgaon  + Takve  + Kamshet' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0093',
  'Sunil Bafana',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Vadgaon  + Takve  + Kamshet' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0094',
  'Nemichand Bafana',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Vadgaon  + Takve  + Kamshet' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0095',
  'Gaurav Dhanduke',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Vadgaon  + Takve  + Kamshet' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0096',
  'N B Masalekar',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Vadgaon  + Takve  + Kamshet' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0097',
  'Vijay Dhanwat',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Vadgaon  + Takve  + Kamshet' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0098',
  'D M Pundalik',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Vadgaon  + Takve  + Kamshet' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0099',
  'A A Jain',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Vadgaon  + Takve  + Kamshet' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0100',
  'R M Makasare',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Vadgaon  + Takve  + Kamshet' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0101',
  'B. S. Pawar',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Vadgaon  + Takve  + Kamshet' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0102',
  'Sharad Sontakke',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Vadgaon  + Takve  + Kamshet' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0103',
  'Shreyash Tompe',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Vadgaon  + Takve  + Kamshet' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0104',
  'Suhas Raut',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Vadgaon  + Takve  + Kamshet' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0105',
  'Vinay Pande',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Dehugaon + Soamatne Phata' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0106',
  'Ashwini Mahajan',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Dehugaon + Soamatne Phata' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0107',
  'Shrikant Govande',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Dehugaon + Soamatne Phata' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0108',
  'Sangeeta Govande',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Dehugaon + Soamatne Phata' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0109',
  'Pravin Pawar',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Dehugaon + Soamatne Phata' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0110',
  'Sheetal Jadhav',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Dehugaon + Soamatne Phata' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0111',
  'Suhas Joshi',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Dehugaon + Soamatne Phata' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0112',
  'Nitin Patil',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Dehugaon + Soamatne Phata' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0113',
  'santosh Bagad',
  'PED',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Dehugaon + Soamatne Phata' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0114',
  'Santosh Gade',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Dehugaon + Soamatne Phata' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0115',
  'S S Gavde',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Dehugaon + Soamatne Phata' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0116',
  'Surendra More',
  'PHY',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Dehugaon + Soamatne Phata' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0117',
  'Snehal More',
  'MS GYNI',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Dehugaon + Soamatne Phata' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0118',
  'Pravin Waghmare',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Dehugaon + Soamatne Phata' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0119',
  'Tirupati Pandhare',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Thergaon  + Ravet + Wakad' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0120',
  'Jitendra Chaudhari',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Thergaon  + Ravet + Wakad' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0121',
  'Santosh Bhalerao',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Thergaon  + Ravet + Wakad' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0122',
  'Lalit Deshmukh',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Thergaon  + Ravet + Wakad' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0123',
  'Swapnil Bhokare',
  'PED',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Thergaon  + Ravet + Wakad' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0124',
  'Prashant Sawant',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Thergaon  + Ravet + Wakad' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0125',
  'Vikram Pawar',
  'PROCTO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Thergaon  + Ravet + Wakad' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0126',
  'Mukesh Falak',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Thergaon  + Ravet + Wakad' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0127',
  'Padeep Musale',
  'GYNI',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Thergaon  + Ravet + Wakad' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0128',
  'Anuraj Deasi',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Thergaon  + Ravet + Wakad' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0129',
  'Arshraj Gaikwad (Wakad)',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Thergaon  + Ravet + Wakad' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0130',
  'Jyoti Walunj',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Thergaon  + Ravet + Wakad' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0131',
  'Jaydeep Shinde',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Thergaon  + Ravet + Wakad' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0132',
  'Prashant Patil',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Thergaon  + Ravet + Wakad' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0133',
  'Manisha Shah',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Thergaon  + Ravet + Wakad' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0134',
  'Alap Borkar',
  'GYNI',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Thergaon  + Ravet + Wakad' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0135',
  'Rahul Dev',
  'GYNI',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chinchwad' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0136',
  'Nitin Chaukkar',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chinchwad' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0137',
  'Navin Dhakad',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chinchwad' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0138',
  'Rajkumar Nikalje',
  'CHEST PHY',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chinchwad' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0139',
  'K G Ganjale',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chinchwad' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0140',
  'Aniket Kamathe',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chinchwad' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0141',
  'Ganesh Jadhav',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chinchwad' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0142',
  'Apramey Joshi',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chinchwad' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0143',
  'Manisha Isave',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chinchwad' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0144',
  'Mahendra Garad',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chinchwad' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0145',
  'Prashnat Jadhwar',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chinchwad' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0146',
  'Swapnil Salve',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chinchwad' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0147',
  'Tushar Chaudhari',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chinchwad' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0148',
  'Prashant Tompe  (Pimpri Morwadi ) 6.00Pm',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chinchwad' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0149',
  'Ashwini Shingte',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chinchwad' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0150',
  'Shushant Bagule',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chinchwad' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0151',
  'Pavin Ghadge',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Alephata' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0152',
  'Dhanajay Dongre',
  'NR',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Alephata' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0153',
  'Vijay Kokate',
  'NR',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Alephata' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0154',
  'Avinash Patil',
  'NR',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Alephata' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0155',
  'Ajinkya Brawal',
  'NR',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Alephata' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0156',
  'Rahul Powade',
  'NR',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Alephata' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0157',
  'Satish Kasabe',
  'NR',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Alephata' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0158',
  'Nagesh Hingmire',
  'NR',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Alephata' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0159',
  'Rahul Sarode',
  'NR',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Alephata' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0160',
  'Rushikesh Godage',
  'NR',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Alephata' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0161',
  'Ashish Uchgaonkar',
  'NR',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Alephata' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0162',
  'Sanjay Gadekar',
  'NR',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Alephata' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0163',
  'Manish Gadekar',
  'NR',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Alephata' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0164',
  'Amruta Wakchure',
  'NR',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Manchar' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0165',
  'Satish Gujrathi',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Manchar' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0166',
  'Sayli Todkar',
  'PED',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Manchar' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0167',
  'Shyamal Jodale',
  'PED',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Manchar' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0168',
  'Arti Mancharkar',
  'PED',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Manchar' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0169',
  'Jeevan Londhe',
  'PED',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Manchar' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0170',
  'Ravikumar Sakore',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Manchar' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0171',
  'Harshad Shete',
  'PHY',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Manchar' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0172',
  'Kailas Dhaybar',
  'PED',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Manchar' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0173',
  'Rahul Khade',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Manchar' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0174',
  'Samadhan Jadhav',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Manchar' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0175',
  'Amol Wakchure',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Manchar' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0176',
  'Prajkta Bangar',
  'GYNI',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Manchar' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0177',
  'Pallavi Ghavde',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Manchar' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0178',
  'Varsha Thorat',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Narayangaon' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0179',
  'Lahu Khaire',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Narayangaon' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0180',
  'D V Todkar',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Narayangaon' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0181',
  'Akshay Shewale',
  'PHY',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Narayangaon' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0182',
  'Shahsikant Gulave',
  'PED',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Narayangaon' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0183',
  'Smita Dole',
  'GYNI',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Narayangaon' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0184',
  'Sandeep Dole',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Narayangaon' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0185',
  'Manohar Kawade',
  'PHY',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Narayangaon' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0186',
  'Sachin Thite',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Narayangaon' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0187',
  'Prakash Gaikwad',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Narayangaon' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0188',
  'Pradeep Joshi',
  'SURGEON',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Narayangaon' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0189',
  'Piyush Kulkarni',
  'GYNI',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Narayangaon' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0190',
  'Balasaheb Thorat',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Narayangaon' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0191',
  'Avinash Aher',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Narayangaon' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0192',
  'Dr Mate',
  'NR',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Rajguru Nagar' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0193',
  'Dilip Bhamble',
  'SUGRON',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Rajguru Nagar' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0194',
  'Vilas kajale',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Rajguru Nagar' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0195',
  'Omkar Kajale',
  'PHY',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Rajguru Nagar' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0196',
  'Rajendra Tupe',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Rajguru Nagar' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0197',
  'Purnima Kahane',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Rajguru Nagar' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0198',
  'M B Bhujbal',
  'PHY',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Rajguru Nagar' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0199',
  'R S Salunkhe',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Rajguru Nagar' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0200',
  'R R Salunkhe',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Rajguru Nagar' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0201',
  'Kamlesh Wafgaonkar',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Rajguru Nagar' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0202',
  'Parag Chauhan',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Rajguru Nagar' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0203',
  'Vijay Ambre',
  'GYNI',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Rajguru Nagar' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0204',
  'Jaihind Pokharkar',
  'PED',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Rajguru Nagar' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0205',
  'Ashish Gujarathi',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Rajguru Nagar' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0206',
  'Shekhar Ghumatkar',
  'GYNI',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Rajguru Nagar' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0207',
  'Yogesh Nimonkar',
  'PED',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chakan' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0208',
  'Revannath Kolhe',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chakan' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0209',
  'M G Alhat',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chakan' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0210',
  'Mahesh Pabalkar',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chakan' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0211',
  'Ramesh Jadhav',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chakan' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0212',
  'Tehas Bhujbal',
  'PED',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chakan' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0213',
  'Sameer Divekar',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chakan' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0214',
  'Atul Mandlik',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chakan' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0215',
  'Madan Mane',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chakan' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0216',
  'Kunal Jadhav',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chakan' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0217',
  'Vanita Kharabi',
  'GYNI',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chakan' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0218',
  'Nitin Supekar',
  'GYNI',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chakan' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0219',
  'Sachin Khade',
  'PHY',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chakan' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0220',
  'Chaitali Vispute',
  'GYNI',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chakan' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0221',
  'Nitin Gavane',
  'PHY',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chakan' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0222',
  'Satish Kulkarni',
  'PEDIA',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Mahalunge + Sudumbre' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0223',
  'Navdip Yadav',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Mahalunge + Sudumbre' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0224',
  'Shruti Anawale',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Mahalunge + Sudumbre' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0225',
  'Vidya katkar',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Mahalunge + Sudumbre' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0226',
  'Arun Tiwari',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Mahalunge + Sudumbre' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0227',
  'Pravin Raut',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Mahalunge + Sudumbre' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0228',
  'Ravindra Murhekar',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Mahalunge + Sudumbre' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0229',
  'Vishnu Gite',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Mahalunge + Sudumbre' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0230',
  'Rajesh Kanse',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Mahalunge + Sudumbre' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0231',
  'Reva Sarpotdar',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Mahalunge + Sudumbre' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0232',
  'M D Shaikh',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Mahalunge + Sudumbre' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0233',
  'Bhanudas Patil',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Mahalunge + Sudumbre' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0234',
  'Atul Shinde',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Nighoje + Jawala' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0235',
  'SANJANA ZAVARE',
  'GP-GYNE',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Nighoje + Jawala' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0236',
  'SOMNATH ADAV',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Nighoje + Jawala' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0237',
  'SHUBASH MAVALE',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Nighoje + Jawala' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0238',
  'RAJESH THORAT',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Nighoje + Jawala' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0239',
  'BAJIRAO GOGARE',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Nighoje + Jawala' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0240',
  'PANDURANG THORAT',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Nighoje + Jawala' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0241',
  'SUNIL KADAM',
  'PEDIATRICIAN',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Nighoje + Jawala' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0242',
  'SURESH PATHARE',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Nighoje + Jawala' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0243',
  'SUNITA LALAGE',
  'GP-GYNE',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Nighoje + Jawala' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0244',
  'AABASAHEB KODHADE',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Nighoje + Jawala' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0245',
  'SANDIP G MORE',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Umbraj' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0246',
  'RAJINA KHALE',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Umbraj' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0247',
  'KAKADE AJIT MURALIDHAR',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Umbraj' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0248',
  'ASHOK KOTHADIA',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Umbraj' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0249',
  'MUKTANJALI POTHARKAR',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Umbraj' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0250',
  'MANOJKUMAR KARBHARI KACHALE',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Umbraj' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0251',
  'NIRMALKUMAR KUNDU',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Umbraj' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0252',
  'AMIN A MANIYAR',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Umbraj' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0253',
  'PRATAP A ROHAKALE',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Otur' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0254',
  'SAYAJI DESHMUKH',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Otur' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0255',
  'SUDAKAR HANDE',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Otur' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0256',
  'DHAMALE YUVARAJ',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Otur' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0257',
  'VAIBHAV GAIKAR',
  'GYNI',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Otur' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0258',
  'BHARAT GHOLAP',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Otur' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0259',
  'MAHADEV DHOMASE',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Otur' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0260',
  'NAMDEV BAGUL',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Otur' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0261',
  'SAMIR DEVRAM KUTE',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Otur' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0262',
  'RAHUL TAMBE',
  'GP-GYNE',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Otur' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0263',
  'YOGESH TAMBE',
  'GP-PEDIA',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Otur' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0264',
  'SUSHIL BAGUL',
  'PEDIA',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Otur' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0265',
  'PRASHANT PANSARE',
  'GYNI',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Otur' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0266',
  'SHASHANK B. PHAPALE',
  'SURGEON',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Otur' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0267',
  'AKHADE VISHAL',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Otur' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0268',
  'SWATI TAMBE',
  'GP-GYNE',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Junnar' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0269',
  'Rafik Mokashi',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Junnar' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0270',
  'Ganesh Ingavale',
  'PED',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Junnar' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0271',
  'Ramdas Shinde',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Junnar' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0272',
  'Sachin Dumbre',
  'PED',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Junnar' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0273',
  'Sunil Shewale',
  'PHY',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Junnar' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0274',
  'Mahendra Lokhande',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Junnar' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0275',
  'Aditya Kulkarni',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Junnar' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0276',
  'Madiha Heena Inamdar',
  'GYNI',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Junnar' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0277',
  'Sonal Inamdar',
  'PED',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Junnar' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0278',
  'Ramdas Bhagat',
  'GYNI',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Junnar' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0279',
  'Anit Ahok Karpe',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Junnar' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0280',
  'Sachin Talape',
  'PED',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Junnar' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0281',
  'Sagar Shinde',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Ghodegaon + Shiroli' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0282',
  'Aniket Surve',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Ghodegaon + Shiroli' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0283',
  'Vijay Mandlik',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Ghodegaon + Shiroli' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0284',
  'Shantaram Kale',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Ghodegaon + Shiroli' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0285',
  'Padhama P S',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Ghodegaon + Shiroli' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0286',
  'J R Gholap',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Ghodegaon + Shiroli' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0287',
  'Kailas Dongre',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Ghodegaon + Shiroli' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0288',
  'Vijay Lokhare',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Ghodegaon + Shiroli' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0289',
  'SangramSing Bacchav',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Ghodegaon + Shiroli' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0290',
  'Mohammad J P',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Ghodegaon + Shiroli' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0291',
  'Gomati Pathava',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Ghodegaon + Shiroli' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0292',
  'Nitin gade',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Ghodegaon + Shiroli' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0293',
  'Sham Raut',
  'NR',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Ghodegaon + Shiroli' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0294',
  'N G Patil',
  'NR',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Ghodegaon + Shiroli' AND area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon') LIMIT 1),
  'MKT-DOC-0295',
  'Kiran Varpe',
  'NR',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Alandi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0296',
  'Vishal Bora',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Alandi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0297',
  'Rameshwar Kure',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Alandi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0298',
  'Priyanka Patil',
  'GYNI',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Alandi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0299',
  'Nagesh Khillari',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Alandi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0300',
  'Pravin Deshmukh',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Alandi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0301',
  'Avinash Malekar',
  'ENT',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Alandi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0302',
  'Sagar Rode',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Alandi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0303',
  'Prashant Aher',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Alandi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0304',
  'Sunil Jagtap',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Alandi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0305',
  'Priya Devkar',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Alandi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0306',
  'Amol Devkar',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Alandi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0307',
  'Pradeep Walke',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Alandi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0308',
  'Uttam Mate',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Alandi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0309',
  'Abhijit Tambe',
  'AYU GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Alandi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0310',
  'Sachin Magar',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Alandi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0311',
  'Rajan Chauhan (charoli Phata)',
  'PEDIA',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Bhoasri -I' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0312',
  'Amol Sonje',
  'PED',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Bhoasri -I' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0313',
  'Kirshor Karande',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Bhoasri -I' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0314',
  'Rahul Kesakar',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Bhoasri -I' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0315',
  'Dharmapal Bhambre',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Bhoasri -I' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0316',
  'Suhas Kamble',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Bhoasri -I' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0317',
  'Rahul Surana',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Bhoasri -I' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0318',
  'Swetal Gangawal',
  'GYNI',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Bhoasri -I' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0319',
  'Rohit Prasad',
  'ENT',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Bhoasri -I' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0320',
  'Sunil Patil',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Bhoasri -I' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0321',
  'Santosh Bandwalkar',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Bhoasri -I' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0322',
  'Mrs Gauri Patil',
  'GYNI',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Bhoasri -I' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0323',
  'Sumit Patil',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Bhoasri -I' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0324',
  'Raj Kamble',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chikhali -I' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0325',
  'Santosh Padwad',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chikhali -I' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0326',
  'Khemchand Sarade',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chikhali -I' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0327',
  'M Malekar',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chikhali -I' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0328',
  'Vaishali Kardile',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chikhali -I' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0329',
  'Mahesh Barbade',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chikhali -I' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0330',
  'Ravikant Salunkhe',
  'GYNI',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chikhali -I' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0331',
  'Neha Kalantre',
  'GYNI',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chikhali -I' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0332',
  'Durgaprasad Marathe',
  'PED',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chikhali -I' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0333',
  'Balasaheb Shinde',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chikhali -I' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0334',
  'Vasant Kokate',
  'PED',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chikhali -I' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0335',
  'Vijay Tmabade',
  'PED',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chikhali -I' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0336',
  'Dinesh Patil (Astha)',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chikhali -I' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0337',
  'Sham Shinde(Astha)',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chikhali -I' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0338',
  'Nilesh Bodhe (Astha)',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Moshi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0339',
  'Vishal Kurkute',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Moshi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0340',
  'Sachin Borhade',
  'SURGEON',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Moshi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0341',
  'Nilesh Mule',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Moshi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0342',
  'Sameer Shelake',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Moshi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0343',
  'Siddharth Ghule',
  'PED',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Moshi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0344',
  'Avinash Dere',
  'PED',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Moshi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0345',
  'Krishna Mankar',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Moshi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0346',
  'M S Mankar',
  'GYNI',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Moshi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0347',
  'Yogesh Patil',
  'ENT',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Moshi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0348',
  'Shubhangi Chaudhari',
  'GYNI',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Moshi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0349',
  'Abhijit Kuadle',
  'PED',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Moshi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0350',
  'Kayani Sabale',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Moshi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0351',
  'Prasanna Deshpande',
  'PHY',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Moshi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0352',
  'Nikhil Dorje',
  'ENT',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Moshi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0353',
  'Rajesh Ingave ( Dhanashri Hospi. Moshi)',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Bhosari -II' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0354',
  'Shankar Gore',
  'PED',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Bhosari -II' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0355',
  'Madhuri Zambre',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Bhosari -II' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0356',
  'Deepak More',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Bhosari -II' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0357',
  'Sagar Veer',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Bhosari -II' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0358',
  'Pravin Panchal',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Bhosari -II' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0359',
  'Arun Kinge',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Bhosari -II' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0360',
  'Yogesh Aher',
  'PHY',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Bhosari -II' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0361',
  'Ramesh Kedar',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Bhosari -II' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0362',
  'Anil Khade',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Bhosari -II' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0363',
  'Mahesh Rajgurav',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Bhosari -II' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0364',
  'Sheetal Borhade',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Bhosari -II' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0365',
  'Prushottam Ukirde',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Bhosari -II' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0366',
  'Neeraj Vishwakarma',
  'PED',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Dighi + Bopkhel' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0367',
  'Sandeep Jambhale',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Dighi + Bopkhel' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0368',
  'Manoj Devkar',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Dighi + Bopkhel' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0369',
  'Arti Mujadar',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Dighi + Bopkhel' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0370',
  'Santosh Rode',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Dighi + Bopkhel' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0371',
  'Deepka Shelar',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Dighi + Bopkhel' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0372',
  'V J Pophale',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Dighi + Bopkhel' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0373',
  'Vinod Pote',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Dighi + Bopkhel' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0374',
  'Nilesh Salve',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Dighi + Bopkhel' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0375',
  'N. S. Jadhav',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Dighi + Bopkhel' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0376',
  'Harshada Dhage',
  'GYNI',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Dighi + Bopkhel' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0377',
  'Jyoti Shinde',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Dighi + Bopkhel' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0378',
  'Jaya Barathe',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Dighi + Bopkhel' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0379',
  'Anil Patil',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Dighi + Bopkhel' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0380',
  'Nikhil Sonawane',
  'PED',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Shau Nagar + Jadhavwadi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0381',
  'Bharat Shah',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Shau Nagar + Jadhavwadi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0382',
  'Mrudula Psalkar',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Shau Nagar + Jadhavwadi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0383',
  'Jyoti Dachawar',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Shau Nagar + Jadhavwadi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0384',
  'Amit Sangle',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Shau Nagar + Jadhavwadi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0385',
  'Harish Chaudhari',
  'PHY',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Shau Nagar + Jadhavwadi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0386',
  'Yogesh Gholap',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Shau Nagar + Jadhavwadi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0387',
  'Sunil Yadav',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Shau Nagar + Jadhavwadi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0388',
  'D R Lonkar',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Shau Nagar + Jadhavwadi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0389',
  'Shekhar Gaikwad',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Shau Nagar + Jadhavwadi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0390',
  'Manisha Vanave',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Shau Nagar + Jadhavwadi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0391',
  'Jaysing Jadhav',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Shau Nagar + Jadhavwadi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0392',
  'Riyaz Ahamad',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Shau Nagar + Jadhavwadi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0393',
  'A Khan',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Khadki + Dapodi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0394',
  'Avinash Kodak',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Khadki + Dapodi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0395',
  'Ayesh Sayyad',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Khadki + Dapodi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0396',
  'Jagganath Dhadwad',
  'PHY',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Khadki + Dapodi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0397',
  'Alexander K.A.',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Khadki + Dapodi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0398',
  'Manisha Waghela',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Khadki + Dapodi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0399',
  'Sayyad Khalid',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Khadki + Dapodi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0400',
  'Ashish Dungurwal',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Khadki + Dapodi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0401',
  'Y Aruna',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Khadki + Dapodi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0402',
  'Ratnakar Indamdar',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Khadki + Dapodi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0403',
  'Nilesh Bandari',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Khadki + Dapodi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0404',
  'Kavita Bhandari',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Khadki + Dapodi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0405',
  'Arun Z Patil',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Khadki + Dapodi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0406',
  'Ajay Jain',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Khadki + Dapodi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0407',
  'Ajay Shinde',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Khadki + Dapodi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0408',
  'Smita Patil',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Sangvi + Kasarwadi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0409',
  'Aniruddha Patkar',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Sangvi + Kasarwadi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0410',
  'Prashant Rokade',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Sangvi + Kasarwadi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0411',
  'Prafull Pagare',
  'PHY',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Sangvi + Kasarwadi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0412',
  'Mangal Airekar',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Sangvi + Kasarwadi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0413',
  'Anil Patil',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Sangvi + Kasarwadi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0414',
  'Anup pachange',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Sangvi + Kasarwadi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0415',
  'Omkar Lande',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Sangvi + Kasarwadi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0416',
  'Jayesh Joshi',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Sangvi + Kasarwadi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0417',
  'R B Patil',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Sangvi + Kasarwadi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0418',
  'U S Bhende',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Sangvi + Kasarwadi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0419',
  'Shilpa Patil',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Sangvi + Kasarwadi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0420',
  'Vinod Chauhan',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Sangvi + Kasarwadi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0421',
  'Sameer Shelake ( Krishna Chowk)',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Sangvi + Kasarwadi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0422',
  'Harshit Kumar Khandge',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Sangvi + Kasarwadi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0423',
  'Urmila Zanjurne',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Sangvi + Kasarwadi' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0424',
  'Umakant Wabale',
  'SURGEON',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Pimple Saudagar+ Pimple Nilakh' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0425',
  'Madan Kachua',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Pimple Saudagar+ Pimple Nilakh' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0426',
  'Ramesh Jagdale (Near Dhanjay Wagh)',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Pimple Saudagar+ Pimple Nilakh' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0427',
  'Pradip Patil',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Pimple Saudagar+ Pimple Nilakh' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0428',
  'Shirish Zope',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Pimple Saudagar+ Pimple Nilakh' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0429',
  'Vishal Mule',
  'PED',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Pimple Saudagar+ Pimple Nilakh' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0430',
  'Atul Patil',
  'PROCTO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Pimple Saudagar+ Pimple Nilakh' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0431',
  'Harshal Kalambe',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Pimple Saudagar+ Pimple Nilakh' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0432',
  'Dinesh Chauhan',
  'PED',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Pimple Saudagar+ Pimple Nilakh' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0433',
  'Abhinandan Shah',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Pimple Saudagar+ Pimple Nilakh' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0434',
  'Sachin khalane',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Pimple Saudagar+ Pimple Nilakh' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0435',
  'Dipak Gajare',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Pimple Saudagar+ Pimple Nilakh' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0436',
  'Sushant Shrivastav',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Pimple Saudagar+ Pimple Nilakh' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0437',
  'Shiv Agrawal',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Pimple Saudagar+ Pimple Nilakh' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0438',
  'Ashish Desai (Kokane Chauk )',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Pimple Saudagar+ Pimple Nilakh' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0439',
  'Ashwin Kumar Kahnde',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Pimple Saudagar+ Pimple Nilakh' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0440',
  'Saurabh Giri',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chikhali -II' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0441',
  'R N Patwardhan',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chikhali -II' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0442',
  'Shailesh Bomble',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chikhali -II' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0443',
  'B V Thange',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chikhali -II' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0444',
  'Dattatray Suryawanshi',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chikhali -II' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0445',
  'Geeta Badade',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chikhali -II' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0446',
  'Shivaji Bhosale',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chikhali -II' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0447',
  'Aniket Gopale',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chikhali -II' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0448',
  'Abhay Waykos',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chikhali -II' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0449',
  'Tushar Pisal',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chikhali -II' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0450',
  'Subhash Nikam',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chikhali -II' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0451',
  'Atul kesarkar (Near Astha Hospital)',
  'GP',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chikhali -II' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0452',
  'Dinesh Sangvi',
  'ORTHO',
  true,
  now()
);

INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = 'Chikhali -II' AND area_id = (SELECT id FROM public.areas WHERE name = 'PCMC') LIMIT 1),
  'MKT-DOC-0453',
  'Prashant  Khedkar',
  'GP',
  true,
  now()
);

-- ─────────────────────────────────────────────
-- 5. CREATE ASHOK MULIK USER (if not exists)
--    Arun Khadul and Dheeraj Kande already exist.
-- ─────────────────────────────────────────────

-- Check if Ashok Mulik exists; if not, insert into public.users
-- (auth user must be created via Edge Function for login to work)
INSERT INTO public.users (id, employee_code, full_name, email, role, is_active, created_at, updated_at)
SELECT gen_random_uuid(), 'MKT-MR-004', 'Ashok Mulik', NULL, 'mr', true, now(), now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.users WHERE full_name = 'Ashok Mulik' AND role = 'mr'
);

-- ─────────────────────────────────────────────
-- 6. ASSIGN SUB-AREAS TO MRs
-- ─────────────────────────────────────────────

INSERT INTO public.mr_sub_area_access (id, mr_id, sub_area_id)
SELECT gen_random_uuid(),
       u.id,
       sa.id
FROM public.users u
CROSS JOIN public.sub_areas sa
WHERE (u.employee_code = 'MKT-MR-001' OR u.full_name ILIKE '%Khadul%')
  AND u.role = 'mr'
  AND sa.name = 'Hinjewadi+Marunji+Maan'
  AND sa.area_id = (SELECT id FROM public.areas WHERE name = 'PCMC' LIMIT 1)
  AND NOT EXISTS (
    SELECT 1 FROM public.mr_sub_area_access msa
    WHERE msa.mr_id = u.id AND msa.sub_area_id = sa.id
  )
LIMIT 1;

INSERT INTO public.mr_sub_area_access (id, mr_id, sub_area_id)
SELECT gen_random_uuid(),
       u.id,
       sa.id
FROM public.users u
CROSS JOIN public.sub_areas sa
WHERE (u.employee_code = 'MKT-MR-001' OR u.full_name ILIKE '%Khadul%')
  AND u.role = 'mr'
  AND sa.name = 'Kalewadi + Aditya Birla'
  AND sa.area_id = (SELECT id FROM public.areas WHERE name = 'PCMC' LIMIT 1)
  AND NOT EXISTS (
    SELECT 1 FROM public.mr_sub_area_access msa
    WHERE msa.mr_id = u.id AND msa.sub_area_id = sa.id
  )
LIMIT 1;

INSERT INTO public.mr_sub_area_access (id, mr_id, sub_area_id)
SELECT gen_random_uuid(),
       u.id,
       sa.id
FROM public.users u
CROSS JOIN public.sub_areas sa
WHERE (u.employee_code = 'MKT-MR-001' OR u.full_name ILIKE '%Khadul%')
  AND u.role = 'mr'
  AND sa.name = 'Aundh + Baner'
  AND sa.area_id = (SELECT id FROM public.areas WHERE name = 'PCMC' LIMIT 1)
  AND NOT EXISTS (
    SELECT 1 FROM public.mr_sub_area_access msa
    WHERE msa.mr_id = u.id AND msa.sub_area_id = sa.id
  )
LIMIT 1;

INSERT INTO public.mr_sub_area_access (id, mr_id, sub_area_id)
SELECT gen_random_uuid(),
       u.id,
       sa.id
FROM public.users u
CROSS JOIN public.sub_areas sa
WHERE (u.employee_code = 'MKT-MR-001' OR u.full_name ILIKE '%Khadul%')
  AND u.role = 'mr'
  AND sa.name = 'Dehuroad + Somatne Phata + Talegaon'
  AND sa.area_id = (SELECT id FROM public.areas WHERE name = 'PCMC' LIMIT 1)
  AND NOT EXISTS (
    SELECT 1 FROM public.mr_sub_area_access msa
    WHERE msa.mr_id = u.id AND msa.sub_area_id = sa.id
  )
LIMIT 1;

INSERT INTO public.mr_sub_area_access (id, mr_id, sub_area_id)
SELECT gen_random_uuid(),
       u.id,
       sa.id
FROM public.users u
CROSS JOIN public.sub_areas sa
WHERE (u.employee_code = 'MKT-MR-001' OR u.full_name ILIKE '%Khadul%')
  AND u.role = 'mr'
  AND sa.name = 'Nigdi + Akurdi'
  AND sa.area_id = (SELECT id FROM public.areas WHERE name = 'PCMC' LIMIT 1)
  AND NOT EXISTS (
    SELECT 1 FROM public.mr_sub_area_access msa
    WHERE msa.mr_id = u.id AND msa.sub_area_id = sa.id
  )
LIMIT 1;

INSERT INTO public.mr_sub_area_access (id, mr_id, sub_area_id)
SELECT gen_random_uuid(),
       u.id,
       sa.id
FROM public.users u
CROSS JOIN public.sub_areas sa
WHERE (u.employee_code = 'MKT-MR-001' OR u.full_name ILIKE '%Khadul%')
  AND u.role = 'mr'
  AND sa.name = 'Pimpri + Neharu Nagar'
  AND sa.area_id = (SELECT id FROM public.areas WHERE name = 'PCMC' LIMIT 1)
  AND NOT EXISTS (
    SELECT 1 FROM public.mr_sub_area_access msa
    WHERE msa.mr_id = u.id AND msa.sub_area_id = sa.id
  )
LIMIT 1;

INSERT INTO public.mr_sub_area_access (id, mr_id, sub_area_id)
SELECT gen_random_uuid(),
       u.id,
       sa.id
FROM public.users u
CROSS JOIN public.sub_areas sa
WHERE (u.employee_code = 'MKT-MR-001' OR u.full_name ILIKE '%Khadul%')
  AND u.role = 'mr'
  AND sa.name = 'Vadgaon  + Takve  + Kamshet'
  AND sa.area_id = (SELECT id FROM public.areas WHERE name = 'PCMC' LIMIT 1)
  AND NOT EXISTS (
    SELECT 1 FROM public.mr_sub_area_access msa
    WHERE msa.mr_id = u.id AND msa.sub_area_id = sa.id
  )
LIMIT 1;

INSERT INTO public.mr_sub_area_access (id, mr_id, sub_area_id)
SELECT gen_random_uuid(),
       u.id,
       sa.id
FROM public.users u
CROSS JOIN public.sub_areas sa
WHERE (u.employee_code = 'MKT-MR-001' OR u.full_name ILIKE '%Khadul%')
  AND u.role = 'mr'
  AND sa.name = 'Dehugaon + Soamatne Phata'
  AND sa.area_id = (SELECT id FROM public.areas WHERE name = 'PCMC' LIMIT 1)
  AND NOT EXISTS (
    SELECT 1 FROM public.mr_sub_area_access msa
    WHERE msa.mr_id = u.id AND msa.sub_area_id = sa.id
  )
LIMIT 1;

INSERT INTO public.mr_sub_area_access (id, mr_id, sub_area_id)
SELECT gen_random_uuid(),
       u.id,
       sa.id
FROM public.users u
CROSS JOIN public.sub_areas sa
WHERE (u.employee_code = 'MKT-MR-001' OR u.full_name ILIKE '%Khadul%')
  AND u.role = 'mr'
  AND sa.name = 'Thergaon  + Ravet + Wakad'
  AND sa.area_id = (SELECT id FROM public.areas WHERE name = 'PCMC' LIMIT 1)
  AND NOT EXISTS (
    SELECT 1 FROM public.mr_sub_area_access msa
    WHERE msa.mr_id = u.id AND msa.sub_area_id = sa.id
  )
LIMIT 1;

INSERT INTO public.mr_sub_area_access (id, mr_id, sub_area_id)
SELECT gen_random_uuid(),
       u.id,
       sa.id
FROM public.users u
CROSS JOIN public.sub_areas sa
WHERE (u.employee_code = 'MKT-MR-001' OR u.full_name ILIKE '%Khadul%')
  AND u.role = 'mr'
  AND sa.name = 'Chinchwad'
  AND sa.area_id = (SELECT id FROM public.areas WHERE name = 'PCMC' LIMIT 1)
  AND NOT EXISTS (
    SELECT 1 FROM public.mr_sub_area_access msa
    WHERE msa.mr_id = u.id AND msa.sub_area_id = sa.id
  )
LIMIT 1;

INSERT INTO public.mr_sub_area_access (id, mr_id, sub_area_id)
SELECT gen_random_uuid(),
       u.id,
       sa.id
FROM public.users u
CROSS JOIN public.sub_areas sa
WHERE (u.employee_code = 'MKT-MR-004' OR u.full_name ILIKE '%Mulik%')
  AND u.role = 'mr'
  AND sa.name = 'Alephata'
  AND sa.area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon' LIMIT 1)
  AND NOT EXISTS (
    SELECT 1 FROM public.mr_sub_area_access msa
    WHERE msa.mr_id = u.id AND msa.sub_area_id = sa.id
  )
LIMIT 1;

INSERT INTO public.mr_sub_area_access (id, mr_id, sub_area_id)
SELECT gen_random_uuid(),
       u.id,
       sa.id
FROM public.users u
CROSS JOIN public.sub_areas sa
WHERE (u.employee_code = 'MKT-MR-004' OR u.full_name ILIKE '%Mulik%')
  AND u.role = 'mr'
  AND sa.name = 'Manchar'
  AND sa.area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon' LIMIT 1)
  AND NOT EXISTS (
    SELECT 1 FROM public.mr_sub_area_access msa
    WHERE msa.mr_id = u.id AND msa.sub_area_id = sa.id
  )
LIMIT 1;

INSERT INTO public.mr_sub_area_access (id, mr_id, sub_area_id)
SELECT gen_random_uuid(),
       u.id,
       sa.id
FROM public.users u
CROSS JOIN public.sub_areas sa
WHERE (u.employee_code = 'MKT-MR-004' OR u.full_name ILIKE '%Mulik%')
  AND u.role = 'mr'
  AND sa.name = 'Narayangaon'
  AND sa.area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon' LIMIT 1)
  AND NOT EXISTS (
    SELECT 1 FROM public.mr_sub_area_access msa
    WHERE msa.mr_id = u.id AND msa.sub_area_id = sa.id
  )
LIMIT 1;

INSERT INTO public.mr_sub_area_access (id, mr_id, sub_area_id)
SELECT gen_random_uuid(),
       u.id,
       sa.id
FROM public.users u
CROSS JOIN public.sub_areas sa
WHERE (u.employee_code = 'MKT-MR-004' OR u.full_name ILIKE '%Mulik%')
  AND u.role = 'mr'
  AND sa.name = 'Rajguru Nagar'
  AND sa.area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon' LIMIT 1)
  AND NOT EXISTS (
    SELECT 1 FROM public.mr_sub_area_access msa
    WHERE msa.mr_id = u.id AND msa.sub_area_id = sa.id
  )
LIMIT 1;

INSERT INTO public.mr_sub_area_access (id, mr_id, sub_area_id)
SELECT gen_random_uuid(),
       u.id,
       sa.id
FROM public.users u
CROSS JOIN public.sub_areas sa
WHERE (u.employee_code = 'MKT-MR-004' OR u.full_name ILIKE '%Mulik%')
  AND u.role = 'mr'
  AND sa.name = 'Chakan'
  AND sa.area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon' LIMIT 1)
  AND NOT EXISTS (
    SELECT 1 FROM public.mr_sub_area_access msa
    WHERE msa.mr_id = u.id AND msa.sub_area_id = sa.id
  )
LIMIT 1;

INSERT INTO public.mr_sub_area_access (id, mr_id, sub_area_id)
SELECT gen_random_uuid(),
       u.id,
       sa.id
FROM public.users u
CROSS JOIN public.sub_areas sa
WHERE (u.employee_code = 'MKT-MR-004' OR u.full_name ILIKE '%Mulik%')
  AND u.role = 'mr'
  AND sa.name = 'Mahalunge + Sudumbre'
  AND sa.area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon' LIMIT 1)
  AND NOT EXISTS (
    SELECT 1 FROM public.mr_sub_area_access msa
    WHERE msa.mr_id = u.id AND msa.sub_area_id = sa.id
  )
LIMIT 1;

INSERT INTO public.mr_sub_area_access (id, mr_id, sub_area_id)
SELECT gen_random_uuid(),
       u.id,
       sa.id
FROM public.users u
CROSS JOIN public.sub_areas sa
WHERE (u.employee_code = 'MKT-MR-004' OR u.full_name ILIKE '%Mulik%')
  AND u.role = 'mr'
  AND sa.name = 'Nighoje + Jawala'
  AND sa.area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon' LIMIT 1)
  AND NOT EXISTS (
    SELECT 1 FROM public.mr_sub_area_access msa
    WHERE msa.mr_id = u.id AND msa.sub_area_id = sa.id
  )
LIMIT 1;

INSERT INTO public.mr_sub_area_access (id, mr_id, sub_area_id)
SELECT gen_random_uuid(),
       u.id,
       sa.id
FROM public.users u
CROSS JOIN public.sub_areas sa
WHERE (u.employee_code = 'MKT-MR-004' OR u.full_name ILIKE '%Mulik%')
  AND u.role = 'mr'
  AND sa.name = 'Umbraj'
  AND sa.area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon' LIMIT 1)
  AND NOT EXISTS (
    SELECT 1 FROM public.mr_sub_area_access msa
    WHERE msa.mr_id = u.id AND msa.sub_area_id = sa.id
  )
LIMIT 1;

INSERT INTO public.mr_sub_area_access (id, mr_id, sub_area_id)
SELECT gen_random_uuid(),
       u.id,
       sa.id
FROM public.users u
CROSS JOIN public.sub_areas sa
WHERE (u.employee_code = 'MKT-MR-004' OR u.full_name ILIKE '%Mulik%')
  AND u.role = 'mr'
  AND sa.name = 'Otur'
  AND sa.area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon' LIMIT 1)
  AND NOT EXISTS (
    SELECT 1 FROM public.mr_sub_area_access msa
    WHERE msa.mr_id = u.id AND msa.sub_area_id = sa.id
  )
LIMIT 1;

INSERT INTO public.mr_sub_area_access (id, mr_id, sub_area_id)
SELECT gen_random_uuid(),
       u.id,
       sa.id
FROM public.users u
CROSS JOIN public.sub_areas sa
WHERE (u.employee_code = 'MKT-MR-004' OR u.full_name ILIKE '%Mulik%')
  AND u.role = 'mr'
  AND sa.name = 'Junnar'
  AND sa.area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon' LIMIT 1)
  AND NOT EXISTS (
    SELECT 1 FROM public.mr_sub_area_access msa
    WHERE msa.mr_id = u.id AND msa.sub_area_id = sa.id
  )
LIMIT 1;

INSERT INTO public.mr_sub_area_access (id, mr_id, sub_area_id)
SELECT gen_random_uuid(),
       u.id,
       sa.id
FROM public.users u
CROSS JOIN public.sub_areas sa
WHERE (u.employee_code = 'MKT-MR-004' OR u.full_name ILIKE '%Mulik%')
  AND u.role = 'mr'
  AND sa.name = 'Ghodegaon + Shiroli'
  AND sa.area_id = (SELECT id FROM public.areas WHERE name = 'Narayangaon' LIMIT 1)
  AND NOT EXISTS (
    SELECT 1 FROM public.mr_sub_area_access msa
    WHERE msa.mr_id = u.id AND msa.sub_area_id = sa.id
  )
LIMIT 1;

INSERT INTO public.mr_sub_area_access (id, mr_id, sub_area_id)
SELECT gen_random_uuid(),
       u.id,
       sa.id
FROM public.users u
CROSS JOIN public.sub_areas sa
WHERE (u.employee_code = 'MKT-MR-003' OR u.full_name ILIKE '%Kande%')
  AND u.role = 'mr'
  AND sa.name = 'Alandi'
  AND sa.area_id = (SELECT id FROM public.areas WHERE name = 'PCMC' LIMIT 1)
  AND NOT EXISTS (
    SELECT 1 FROM public.mr_sub_area_access msa
    WHERE msa.mr_id = u.id AND msa.sub_area_id = sa.id
  )
LIMIT 1;

INSERT INTO public.mr_sub_area_access (id, mr_id, sub_area_id)
SELECT gen_random_uuid(),
       u.id,
       sa.id
FROM public.users u
CROSS JOIN public.sub_areas sa
WHERE (u.employee_code = 'MKT-MR-003' OR u.full_name ILIKE '%Kande%')
  AND u.role = 'mr'
  AND sa.name = 'Bhoasri -I'
  AND sa.area_id = (SELECT id FROM public.areas WHERE name = 'PCMC' LIMIT 1)
  AND NOT EXISTS (
    SELECT 1 FROM public.mr_sub_area_access msa
    WHERE msa.mr_id = u.id AND msa.sub_area_id = sa.id
  )
LIMIT 1;

INSERT INTO public.mr_sub_area_access (id, mr_id, sub_area_id)
SELECT gen_random_uuid(),
       u.id,
       sa.id
FROM public.users u
CROSS JOIN public.sub_areas sa
WHERE (u.employee_code = 'MKT-MR-003' OR u.full_name ILIKE '%Kande%')
  AND u.role = 'mr'
  AND sa.name = 'Chikhali -I'
  AND sa.area_id = (SELECT id FROM public.areas WHERE name = 'PCMC' LIMIT 1)
  AND NOT EXISTS (
    SELECT 1 FROM public.mr_sub_area_access msa
    WHERE msa.mr_id = u.id AND msa.sub_area_id = sa.id
  )
LIMIT 1;

INSERT INTO public.mr_sub_area_access (id, mr_id, sub_area_id)
SELECT gen_random_uuid(),
       u.id,
       sa.id
FROM public.users u
CROSS JOIN public.sub_areas sa
WHERE (u.employee_code = 'MKT-MR-003' OR u.full_name ILIKE '%Kande%')
  AND u.role = 'mr'
  AND sa.name = 'Moshi'
  AND sa.area_id = (SELECT id FROM public.areas WHERE name = 'PCMC' LIMIT 1)
  AND NOT EXISTS (
    SELECT 1 FROM public.mr_sub_area_access msa
    WHERE msa.mr_id = u.id AND msa.sub_area_id = sa.id
  )
LIMIT 1;

INSERT INTO public.mr_sub_area_access (id, mr_id, sub_area_id)
SELECT gen_random_uuid(),
       u.id,
       sa.id
FROM public.users u
CROSS JOIN public.sub_areas sa
WHERE (u.employee_code = 'MKT-MR-003' OR u.full_name ILIKE '%Kande%')
  AND u.role = 'mr'
  AND sa.name = 'Bhosari -II'
  AND sa.area_id = (SELECT id FROM public.areas WHERE name = 'PCMC' LIMIT 1)
  AND NOT EXISTS (
    SELECT 1 FROM public.mr_sub_area_access msa
    WHERE msa.mr_id = u.id AND msa.sub_area_id = sa.id
  )
LIMIT 1;

INSERT INTO public.mr_sub_area_access (id, mr_id, sub_area_id)
SELECT gen_random_uuid(),
       u.id,
       sa.id
FROM public.users u
CROSS JOIN public.sub_areas sa
WHERE (u.employee_code = 'MKT-MR-003' OR u.full_name ILIKE '%Kande%')
  AND u.role = 'mr'
  AND sa.name = 'Dighi + Bopkhel'
  AND sa.area_id = (SELECT id FROM public.areas WHERE name = 'PCMC' LIMIT 1)
  AND NOT EXISTS (
    SELECT 1 FROM public.mr_sub_area_access msa
    WHERE msa.mr_id = u.id AND msa.sub_area_id = sa.id
  )
LIMIT 1;

INSERT INTO public.mr_sub_area_access (id, mr_id, sub_area_id)
SELECT gen_random_uuid(),
       u.id,
       sa.id
FROM public.users u
CROSS JOIN public.sub_areas sa
WHERE (u.employee_code = 'MKT-MR-003' OR u.full_name ILIKE '%Kande%')
  AND u.role = 'mr'
  AND sa.name = 'Shau Nagar + Jadhavwadi'
  AND sa.area_id = (SELECT id FROM public.areas WHERE name = 'PCMC' LIMIT 1)
  AND NOT EXISTS (
    SELECT 1 FROM public.mr_sub_area_access msa
    WHERE msa.mr_id = u.id AND msa.sub_area_id = sa.id
  )
LIMIT 1;

INSERT INTO public.mr_sub_area_access (id, mr_id, sub_area_id)
SELECT gen_random_uuid(),
       u.id,
       sa.id
FROM public.users u
CROSS JOIN public.sub_areas sa
WHERE (u.employee_code = 'MKT-MR-003' OR u.full_name ILIKE '%Kande%')
  AND u.role = 'mr'
  AND sa.name = 'Khadki + Dapodi'
  AND sa.area_id = (SELECT id FROM public.areas WHERE name = 'PCMC' LIMIT 1)
  AND NOT EXISTS (
    SELECT 1 FROM public.mr_sub_area_access msa
    WHERE msa.mr_id = u.id AND msa.sub_area_id = sa.id
  )
LIMIT 1;

INSERT INTO public.mr_sub_area_access (id, mr_id, sub_area_id)
SELECT gen_random_uuid(),
       u.id,
       sa.id
FROM public.users u
CROSS JOIN public.sub_areas sa
WHERE (u.employee_code = 'MKT-MR-003' OR u.full_name ILIKE '%Kande%')
  AND u.role = 'mr'
  AND sa.name = 'Sangvi + Kasarwadi'
  AND sa.area_id = (SELECT id FROM public.areas WHERE name = 'PCMC' LIMIT 1)
  AND NOT EXISTS (
    SELECT 1 FROM public.mr_sub_area_access msa
    WHERE msa.mr_id = u.id AND msa.sub_area_id = sa.id
  )
LIMIT 1;

INSERT INTO public.mr_sub_area_access (id, mr_id, sub_area_id)
SELECT gen_random_uuid(),
       u.id,
       sa.id
FROM public.users u
CROSS JOIN public.sub_areas sa
WHERE (u.employee_code = 'MKT-MR-003' OR u.full_name ILIKE '%Kande%')
  AND u.role = 'mr'
  AND sa.name = 'Pimple Saudagar+ Pimple Nilakh'
  AND sa.area_id = (SELECT id FROM public.areas WHERE name = 'PCMC' LIMIT 1)
  AND NOT EXISTS (
    SELECT 1 FROM public.mr_sub_area_access msa
    WHERE msa.mr_id = u.id AND msa.sub_area_id = sa.id
  )
LIMIT 1;

INSERT INTO public.mr_sub_area_access (id, mr_id, sub_area_id)
SELECT gen_random_uuid(),
       u.id,
       sa.id
FROM public.users u
CROSS JOIN public.sub_areas sa
WHERE (u.employee_code = 'MKT-MR-003' OR u.full_name ILIKE '%Kande%')
  AND u.role = 'mr'
  AND sa.name = 'Chikhali -II'
  AND sa.area_id = (SELECT id FROM public.areas WHERE name = 'PCMC' LIMIT 1)
  AND NOT EXISTS (
    SELECT 1 FROM public.mr_sub_area_access msa
    WHERE msa.mr_id = u.id AND msa.sub_area_id = sa.id
  )
LIMIT 1;

-- ─────────────────────────────────────────────
-- 7. ENSURE MR-MANAGER MAPPINGS
--    Map all 3 MRs to both managers (Manoj & Kiran)
-- ─────────────────────────────────────────────

DO $$
DECLARE
  v_mr RECORD;
  v_mgr RECORD;
BEGIN
  FOR v_mr IN
    SELECT id FROM public.users
    WHERE role = 'mr' AND is_active = true
      AND (employee_code IN ('MKT-MR-001', 'MKT-MR-003', 'MKT-MR-004')
           OR full_name IN ('Arun Khadul', 'Ashok Mulik')
           OR full_name ILIKE '%Kande%' OR full_name ILIKE '%Khande%')
  LOOP
    FOR v_mgr IN
      SELECT id FROM public.users
      WHERE role = 'manager' AND is_active = true
    LOOP
      INSERT INTO public.mr_manager_map (id, mr_id, manager_id, assigned_at)
      VALUES (gen_random_uuid(), v_mr.id, v_mgr.id, now())
      ON CONFLICT (mr_id, manager_id) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

COMMIT;

-- ─────────────────────────────────────────────
-- VERIFICATION QUERIES
-- ─────────────────────────────────────────────

-- Check areas
SELECT name, code FROM public.areas ORDER BY name;

-- Check sub-areas per area
SELECT a.name AS area, sa.name AS sub_area, sa.code
FROM public.sub_areas sa
JOIN public.areas a ON a.id = sa.area_id
ORDER BY a.name, sa.name;

-- Check doctor count per sub-area
SELECT a.name AS area, sa.name AS sub_area, COUNT(d.id) AS doctor_count
FROM public.doctors d
JOIN public.sub_areas sa ON sa.id = d.sub_area_id
JOIN public.areas a ON a.id = sa.area_id
GROUP BY a.name, sa.name
ORDER BY a.name, sa.name;

-- Check MR access
SELECT u.full_name AS mr, a.name AS area, sa.name AS sub_area
FROM public.mr_sub_area_access msa
JOIN public.users u ON u.id = msa.mr_id
JOIN public.sub_areas sa ON sa.id = msa.sub_area_id
JOIN public.areas a ON a.id = sa.area_id
ORDER BY u.full_name, a.name, sa.name;

-- Check MR-Manager mappings
SELECT mr.full_name AS mr, mgr.full_name AS manager
FROM public.mr_manager_map mmm
JOIN public.users mr ON mr.id = mmm.mr_id
JOIN public.users mgr ON mgr.id = mmm.manager_id
ORDER BY mr.full_name;
