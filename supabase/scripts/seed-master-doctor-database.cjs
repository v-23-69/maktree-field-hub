/**
 * Reads Master_Doctor_Database.xlsx and generates a SQL migration
 * to seed areas, sub_areas, doctors, users (Ashok Mulik), and mr_sub_area_access.
 */
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const wb = XLSX.readFile(path.join(__dirname, '..', '..', 'Master_Doctor_Database.xlsx'));
const ws = wb.Sheets['Master Database'];
const raw = XLSX.utils.sheet_to_json(ws, { header: 1 });

// Row 3 (0-indexed) is the header row
const HEADER_ROW = 3;
const headers = raw[HEADER_ROW];
const COL = {
  territory: headers.indexOf('Territory'),
  mrName: headers.indexOf('MR Name'),
  subArea: headers.indexOf('Sub-Area'),
  subAreaFull: headers.indexOf('Sub-Area Full Name'),
  doctorName: headers.indexOf('Doctor Name'),
  speciality: headers.indexOf('Speciality'),
};

// Parse all data rows
const rows = [];
for (let i = HEADER_ROW + 1; i < raw.length; i++) {
  const r = raw[i];
  if (!r || r.length < 7 || !r[COL.doctorName]) continue;
  rows.push({
    territory: String(r[COL.territory] || '').trim(),
    mrName: String(r[COL.mrName] || '').trim(),
    subArea: String(r[COL.subArea] || '').trim(),
    subAreaFull: String(r[COL.subAreaFull] || '').trim(),
    doctorName: String(r[COL.doctorName] || '').trim(),
    speciality: String(r[COL.speciality] || '').trim(),
  });
}

// Extract unique territories (→ areas)
const territories = [...new Set(rows.map(r => r.territory))].filter(Boolean);

// Extract unique sub-areas per territory
const subAreaMap = new Map(); // key: "territory|subArea" → { territory, subArea, subAreaFull }
for (const r of rows) {
  const key = `${r.territory}|${r.subArea}`;
  if (!subAreaMap.has(key)) {
    subAreaMap.set(key, { territory: r.territory, subArea: r.subArea, subAreaFull: r.subAreaFull });
  }
}

// Extract unique MRs
const mrNames = [...new Set(rows.map(r => r.mrName))].filter(Boolean);

// Build MR → sub-area mapping
const mrSubAreas = new Map(); // mrName → Set of "territory|subArea"
for (const r of rows) {
  if (!mrSubAreas.has(r.mrName)) mrSubAreas.set(r.mrName, new Set());
  mrSubAreas.get(r.mrName).add(`${r.territory}|${r.subArea}`);
}

// Build sub-area → doctors mapping
const subAreaDoctors = new Map(); // "territory|subArea" → [{doctorName, speciality}]
for (const r of rows) {
  const key = `${r.territory}|${r.subArea}`;
  if (!subAreaDoctors.has(key)) subAreaDoctors.set(key, []);
  subAreaDoctors.get(key).push({ doctorName: r.doctorName, speciality: r.speciality });
}

// Generate SQL
const esc = (s) => s.replace(/'/g, "''");
let sql = '';

sql += `-- =============================================================
-- MASTER DOCTOR DATABASE SEED
-- Generated from Master_Doctor_Database.xlsx
-- Territories: ${territories.join(', ')}
-- MRs: ${mrNames.join(', ')}
-- Total Doctors: ${rows.length}
-- Total Sub-Areas: ${subAreaMap.size}
-- =============================================================

BEGIN;

-- ─────────────────────────────────────────────
-- 1. CLEAN OLD DATA (areas, sub_areas, doctors, access)
--    This removes fragmented/test data and starts fresh.
-- ─────────────────────────────────────────────

-- Remove all MR sub-area access rows
DELETE FROM public.mr_sub_area_access;

-- Remove all doctors (cascade will handle promoted_products etc. if FK exists)
DELETE FROM public.doctors;

-- Remove all sub_areas
DELETE FROM public.sub_areas;

-- Remove all areas
DELETE FROM public.areas;

-- ─────────────────────────────────────────────
-- 2. INSERT AREAS (Territories)
-- ─────────────────────────────────────────────

`;

for (const t of territories) {
  const code = t.toUpperCase().replace(/[^A-Z0-9]/g, '-');
  sql += `INSERT INTO public.areas (id, name, code, is_active, created_at)
VALUES (gen_random_uuid(), '${esc(t)}', '${esc(code)}', true, now())
ON CONFLICT DO NOTHING;\n\n`;
}

sql += `-- ─────────────────────────────────────────────
-- 3. INSERT SUB-AREAS
-- ─────────────────────────────────────────────

`;

for (const [key, sa] of subAreaMap) {
  const code = sa.subArea.toUpperCase().replace(/[^A-Z0-9]/g, '-').replace(/-+/g, '-');
  sql += `INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = '${esc(sa.territory)}' LIMIT 1),
  '${esc(sa.subAreaFull)}',
  '${esc(code)}',
  true,
  now()
)
ON CONFLICT DO NOTHING;\n\n`;
}

sql += `-- ─────────────────────────────────────────────
-- 4. INSERT DOCTORS
-- ─────────────────────────────────────────────

`;

let doctorSeq = 1;
for (const [key, doctors] of subAreaDoctors) {
  const sa = subAreaMap.get(key);
  for (const doc of doctors) {
    const code = `MKT-DOC-${String(doctorSeq++).padStart(4, '0')}`;
    sql += `INSERT INTO public.doctors (id, sub_area_id, doctor_code, full_name, speciality, is_active, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.sub_areas WHERE name = '${esc(sa.subAreaFull)}' AND area_id = (SELECT id FROM public.areas WHERE name = '${esc(sa.territory)}') LIMIT 1),
  '${esc(code)}',
  '${esc(doc.doctorName)}',
  ${doc.speciality ? `'${esc(doc.speciality)}'` : 'NULL'},
  true,
  now()
);\n\n`;
  }
}

sql += `-- ─────────────────────────────────────────────
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

`;

// Known MR employee codes mapping
const mrCodeMap = {
  'Arun Khadul': 'MKT-MR-001',
  'Dheeraj Kande': 'MKT-MR-003',
  'Ashok Mulik': 'MKT-MR-004',
};

// For the name matching in DB, "Dheeraj Kande" in Excel vs "Dheeraj Khande" in DB
const mrDbNames = {
  'Arun Khadul': 'Arun Khadul',
  'Dheeraj Kande': 'Dheeraj Kande',  // We'll match by employee_code instead
  'Ashok Mulik': 'Ashok Mulik',
};

for (const [mrName, subAreaKeys] of mrSubAreas) {
  const code = mrCodeMap[mrName] || mrName;
  for (const key of subAreaKeys) {
    const sa = subAreaMap.get(key);
    sql += `INSERT INTO public.mr_sub_area_access (id, mr_id, sub_area_id)
SELECT gen_random_uuid(),
       u.id,
       sa.id
FROM public.users u
CROSS JOIN public.sub_areas sa
WHERE (u.employee_code = '${esc(code)}' OR u.full_name ILIKE '%${esc(mrName.split(' ')[1] || mrName)}%')
  AND u.role = 'mr'
  AND sa.name = '${esc(sa.subAreaFull)}'
  AND sa.area_id = (SELECT id FROM public.areas WHERE name = '${esc(sa.territory)}' LIMIT 1)
  AND NOT EXISTS (
    SELECT 1 FROM public.mr_sub_area_access msa
    WHERE msa.mr_id = u.id AND msa.sub_area_id = sa.id
  )
LIMIT 1;\n\n`;
  }
}

sql += `-- ─────────────────────────────────────────────
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
`;

// Write to file
const outPath = path.join(__dirname, 'seed-master-doctor-database.sql');
fs.writeFileSync(outPath, sql, 'utf-8');

console.log(`✓ SQL written to: ${outPath}`);
console.log(`  Areas: ${territories.length}`);
console.log(`  Sub-areas: ${subAreaMap.size}`);
console.log(`  Doctors: ${rows.length}`);
console.log(`  MRs: ${mrNames.length}`);
console.log(`  MR → Sub-area assignments: ${[...mrSubAreas.values()].reduce((s, v) => s + v.size, 0)}`);
