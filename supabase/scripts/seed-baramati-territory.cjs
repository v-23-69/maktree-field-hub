/**
 * Reads Baramati Data Base.xlsx and generates SQL for area, sub_areas, and doctors.
 * Run: node supabase/scripts/seed-baramati-territory.cjs > supabase/migrations/20260525115408_baramati_territory_and_vacancy_snapshot.sql
 */
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const wb = XLSX.readFile(path.join(__dirname, '..', '..', 'Baramati Data Base.xlsx'));
const raw = XLSX.utils.sheet_to_json(wb.Sheets['Doctor Directory'], { header: 1, defval: '' });

const COL = { name: 0, qly: 1, spec: 2, addr: 3, city: 4, mob: 5, dob: 6, ma: 7 };

const CITY_ALIASES = {
  'NIMGAON KETKI': 'Nimgaon Ketki',
  'NIMGOAN KETKI': 'Nimgaon Ketki',
  'NIMGOAN KETAKI': 'Nimgaon Ketki',
  'MALEGAON BK': 'Malegaon BK',
  'MALEGOON BK.': 'Malegaon BK',
  'MALEGOON BK': 'Malegaon BK',
  'MALEGOAN BK.': 'Malegaon BK',
  'SAKHARWADI': 'Sakharwadi',
  'SAKHAR-WADI': 'Sakharwadi',
  'DORLEWADI': 'Dorlewadi',
  'DORLEWAD': 'Dorlewadi',
  'MORGOAN': 'Morgaon',
  'MORGAON': 'Morgaon',
  'BARAMATI MIDC': 'Baramati MIDC',
  BARAMATI: 'Baramati',
  BHIGWAN: 'Bhigwan',
  DAUND: 'Daund',
  INDAPUR: 'Indapur',
  NIRA: 'Nira',
  SOMESHWAR: 'Someshwar',
  WALCHANDNAGAR: 'Walchandnagar',
  PANDARE: 'Pandare',
  SANGVI: 'Sangvi',
  SUPA: 'Supa',
  'MALEGAON FACTORY': 'Malegaon Factory',
  KURKUMBH: 'Kurkumbh',
  ZARGADWADI: 'Zargadwadi',
  ANTHURNE: 'Anthurne',
  JUNCTION: 'Junction',
  LASURNE: 'Lasurne',
  SANSAR: 'Sansar',
  KAMBLESHWAR: 'Kambleshwar',
  WANEWADI: 'Wanewadi',
  JALGAON: 'Jalgaon',
  'KARHA-WAGAJ': 'Karha-Wagaj',
  KORAHALE: 'Korahale',
};

function normCity(c) {
  const u = String(c || 'BARAMATI')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');
  if (CITY_ALIASES[u]) return CITY_ALIASES[u];
  return u
    .toLowerCase()
    .replace(/\b\w/g, (x) => x.toUpperCase());
}

function esc(s) {
  return String(s ?? '').replace(/'/g, "''");
}

function subAreaCode(name) {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

function parseDayMonth(val) {
  const s = String(val || '').trim();
  if (!s) return null;
  const m = s.match(/^(\d{1,2})[-/]([A-Za-z]{3,})$/);
  if (!m) return null;
  const months = {
    jan: '01',
    feb: '02',
    mar: '03',
    apr: '04',
    may: '05',
    jun: '06',
    jul: '07',
    aug: '08',
    sep: '09',
    oct: '10',
    nov: '11',
    dec: '12',
  };
  const mm = months[m[2].slice(0, 3).toLowerCase()];
  if (!mm) return null;
  const dd = m[1].padStart(2, '0');
  return `2000-${mm}-${dd}`;
}

const doctors = [];
for (let i = 2; i < raw.length; i++) {
  const row = raw[i];
  const full_name = String(row[COL.name] || '').trim();
  if (!full_name) continue;
  doctors.push({
    full_name,
    qualification: String(row[COL.qly] || '').trim() || null,
    speciality: String(row[COL.spec] || '').trim() || null,
    address: String(row[COL.addr] || '').trim() || null,
    city: normCity(row[COL.city]),
    mobile: String(row[COL.mob] || '').trim() || null,
    birthday: parseDayMonth(row[COL.dob]),
    marriage_anniversary: parseDayMonth(row[COL.ma]),
  });
}

const subAreas = [...new Set(doctors.map((d) => d.city))].sort((a, b) => a.localeCompare(b));

let sql = `-- Baramati territory seed + manager territory vacancy snapshot RPC
-- Generated from Baramati Data Base.xlsx (${doctors.length} doctors, ${subAreas.length} sub-areas)

BEGIN;

-- ── Territory vacancy snapshot (managers + admins) ──
CREATE OR REPLACE FUNCTION public.list_territory_vacancy_snapshot()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'area_id', a.id,
        'area_name', a.name,
        'area_code', a.code,
        'has_coverage',
          EXISTS (
            SELECT 1
            FROM public.sub_areas sa
            INNER JOIN public.mr_sub_area_access msa ON msa.sub_area_id = sa.id
            WHERE sa.area_id = a.id
              AND sa.is_active = true
          ),
        'total_sub_areas', (
          SELECT COUNT(*)::int
          FROM public.sub_areas sa
          WHERE sa.area_id = a.id AND sa.is_active = true
        ),
        'assigned_sub_areas', (
          SELECT COUNT(DISTINCT sa.id)::int
          FROM public.sub_areas sa
          INNER JOIN public.mr_sub_area_access msa ON msa.sub_area_id = sa.id
          WHERE sa.area_id = a.id AND sa.is_active = true
        ),
        'sub_areas', (
          SELECT COALESCE(
            jsonb_agg(
              jsonb_build_object(
                'id', sa.id,
                'name', sa.name,
                'code', sa.code,
                'is_assigned',
                  EXISTS (
                    SELECT 1
                    FROM public.mr_sub_area_access m
                    WHERE m.sub_area_id = sa.id
                  )
              )
              ORDER BY sa.name
            ),
            '[]'::jsonb
          )
          FROM public.sub_areas sa
          WHERE sa.area_id = a.id AND sa.is_active = true
        )
      )
      ORDER BY a.name
    ),
    '[]'::jsonb
  )
  FROM public.areas a
  WHERE a.is_active = true;
$$;

REVOKE ALL ON FUNCTION public.list_territory_vacancy_snapshot() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_territory_vacancy_snapshot() TO authenticated;

-- ── Baramati territory ──
INSERT INTO public.areas (id, name, code, is_active, created_at)
SELECT gen_random_uuid(), 'Baramati', 'BARAMATI', true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.areas WHERE name = 'Baramati');

`;

for (const name of subAreas) {
  const code = `BRM-${subAreaCode(name)}`;
  sql += `INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
SELECT
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'Baramati' LIMIT 1),
  '${esc(name)}',
  '${esc(code)}',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.sub_areas sa
  INNER JOIN public.areas a ON a.id = sa.area_id
  WHERE a.name = 'Baramati' AND sa.name = '${esc(name)}'
);

`;
}

let seq = 1;
for (const doc of doctors) {
  const code = `BRM-DOC-${String(seq++).padStart(4, '0')}`;
  const bday = doc.birthday ? `'${doc.birthday}'` : 'NULL';
  const ma = doc.marriage_anniversary ? `'${doc.marriage_anniversary}'` : 'NULL';
  sql += `INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = '${esc(doc.city)}' LIMIT 1),
  '${code}',
  '${esc(doc.full_name)}',
  ${doc.speciality ? `'${esc(doc.speciality)}'` : 'NULL'},
  ${doc.qualification ? `'${esc(doc.qualification)}'` : 'NULL'},
  ${doc.address ? `'${esc(doc.address)}'` : 'NULL'},
  '${esc(doc.city)}',
  ${doc.mobile ? `'${esc(doc.mobile)}'` : 'NULL'},
  ${bday},
  ${ma},
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = '${esc(doc.full_name)}'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = '${esc(doc.city)}' LIMIT 1
    )
);

`;
}

sql += `COMMIT;
`;

const outPath =
  process.argv[2] ||
  path.join(__dirname, '..', 'migrations', '20260525115408_baramati_territory_and_vacancy_snapshot.sql');
fs.writeFileSync(outPath, sql, 'utf8');
console.error(`Wrote ${outPath} (${sql.length} bytes)`);
