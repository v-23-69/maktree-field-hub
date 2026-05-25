-- Baramati territory seed + manager territory vacancy snapshot RPC
-- Generated from Baramati Data Base.xlsx (274 doctors, 28 sub-areas)

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

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
SELECT
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'Baramati' LIMIT 1),
  'Anthurne',
  'BRM-ANTHURNE',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.sub_areas sa
  INNER JOIN public.areas a ON a.id = sa.area_id
  WHERE a.name = 'Baramati' AND sa.name = 'Anthurne'
);

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
SELECT
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'Baramati' LIMIT 1),
  'Baramati',
  'BRM-BARAMATI',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.sub_areas sa
  INNER JOIN public.areas a ON a.id = sa.area_id
  WHERE a.name = 'Baramati' AND sa.name = 'Baramati'
);

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
SELECT
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'Baramati' LIMIT 1),
  'Baramati MIDC',
  'BRM-BARAMATI-MIDC',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.sub_areas sa
  INNER JOIN public.areas a ON a.id = sa.area_id
  WHERE a.name = 'Baramati' AND sa.name = 'Baramati MIDC'
);

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
SELECT
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'Baramati' LIMIT 1),
  'Bhigwan',
  'BRM-BHIGWAN',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.sub_areas sa
  INNER JOIN public.areas a ON a.id = sa.area_id
  WHERE a.name = 'Baramati' AND sa.name = 'Bhigwan'
);

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
SELECT
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'Baramati' LIMIT 1),
  'Daund',
  'BRM-DAUND',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.sub_areas sa
  INNER JOIN public.areas a ON a.id = sa.area_id
  WHERE a.name = 'Baramati' AND sa.name = 'Daund'
);

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
SELECT
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'Baramati' LIMIT 1),
  'Dorlewadi',
  'BRM-DORLEWADI',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.sub_areas sa
  INNER JOIN public.areas a ON a.id = sa.area_id
  WHERE a.name = 'Baramati' AND sa.name = 'Dorlewadi'
);

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
SELECT
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'Baramati' LIMIT 1),
  'Indapur',
  'BRM-INDAPUR',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.sub_areas sa
  INNER JOIN public.areas a ON a.id = sa.area_id
  WHERE a.name = 'Baramati' AND sa.name = 'Indapur'
);

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
SELECT
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'Baramati' LIMIT 1),
  'Jalgaon',
  'BRM-JALGAON',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.sub_areas sa
  INNER JOIN public.areas a ON a.id = sa.area_id
  WHERE a.name = 'Baramati' AND sa.name = 'Jalgaon'
);

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
SELECT
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'Baramati' LIMIT 1),
  'Junction',
  'BRM-JUNCTION',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.sub_areas sa
  INNER JOIN public.areas a ON a.id = sa.area_id
  WHERE a.name = 'Baramati' AND sa.name = 'Junction'
);

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
SELECT
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'Baramati' LIMIT 1),
  'Kambleshwar',
  'BRM-KAMBLESHWAR',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.sub_areas sa
  INNER JOIN public.areas a ON a.id = sa.area_id
  WHERE a.name = 'Baramati' AND sa.name = 'Kambleshwar'
);

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
SELECT
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'Baramati' LIMIT 1),
  'Karha-Wagaj',
  'BRM-KARHA-WAGAJ',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.sub_areas sa
  INNER JOIN public.areas a ON a.id = sa.area_id
  WHERE a.name = 'Baramati' AND sa.name = 'Karha-Wagaj'
);

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
SELECT
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'Baramati' LIMIT 1),
  'Korahale',
  'BRM-KORAHALE',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.sub_areas sa
  INNER JOIN public.areas a ON a.id = sa.area_id
  WHERE a.name = 'Baramati' AND sa.name = 'Korahale'
);

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
SELECT
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'Baramati' LIMIT 1),
  'Kurkumbh',
  'BRM-KURKUMBH',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.sub_areas sa
  INNER JOIN public.areas a ON a.id = sa.area_id
  WHERE a.name = 'Baramati' AND sa.name = 'Kurkumbh'
);

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
SELECT
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'Baramati' LIMIT 1),
  'Lasurne',
  'BRM-LASURNE',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.sub_areas sa
  INNER JOIN public.areas a ON a.id = sa.area_id
  WHERE a.name = 'Baramati' AND sa.name = 'Lasurne'
);

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
SELECT
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'Baramati' LIMIT 1),
  'Malegaon BK',
  'BRM-MALEGAON-BK',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.sub_areas sa
  INNER JOIN public.areas a ON a.id = sa.area_id
  WHERE a.name = 'Baramati' AND sa.name = 'Malegaon BK'
);

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
SELECT
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'Baramati' LIMIT 1),
  'Malegaon Factory',
  'BRM-MALEGAON-FACTORY',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.sub_areas sa
  INNER JOIN public.areas a ON a.id = sa.area_id
  WHERE a.name = 'Baramati' AND sa.name = 'Malegaon Factory'
);

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
SELECT
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'Baramati' LIMIT 1),
  'Morgaon',
  'BRM-MORGAON',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.sub_areas sa
  INNER JOIN public.areas a ON a.id = sa.area_id
  WHERE a.name = 'Baramati' AND sa.name = 'Morgaon'
);

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
SELECT
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'Baramati' LIMIT 1),
  'Nimgaon Ketki',
  'BRM-NIMGAON-KETKI',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.sub_areas sa
  INNER JOIN public.areas a ON a.id = sa.area_id
  WHERE a.name = 'Baramati' AND sa.name = 'Nimgaon Ketki'
);

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
SELECT
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'Baramati' LIMIT 1),
  'Nira',
  'BRM-NIRA',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.sub_areas sa
  INNER JOIN public.areas a ON a.id = sa.area_id
  WHERE a.name = 'Baramati' AND sa.name = 'Nira'
);

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
SELECT
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'Baramati' LIMIT 1),
  'Pandare',
  'BRM-PANDARE',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.sub_areas sa
  INNER JOIN public.areas a ON a.id = sa.area_id
  WHERE a.name = 'Baramati' AND sa.name = 'Pandare'
);

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
SELECT
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'Baramati' LIMIT 1),
  'Sakharwadi',
  'BRM-SAKHARWADI',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.sub_areas sa
  INNER JOIN public.areas a ON a.id = sa.area_id
  WHERE a.name = 'Baramati' AND sa.name = 'Sakharwadi'
);

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
SELECT
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'Baramati' LIMIT 1),
  'Sangvi',
  'BRM-SANGVI',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.sub_areas sa
  INNER JOIN public.areas a ON a.id = sa.area_id
  WHERE a.name = 'Baramati' AND sa.name = 'Sangvi'
);

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
SELECT
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'Baramati' LIMIT 1),
  'Sansar',
  'BRM-SANSAR',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.sub_areas sa
  INNER JOIN public.areas a ON a.id = sa.area_id
  WHERE a.name = 'Baramati' AND sa.name = 'Sansar'
);

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
SELECT
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'Baramati' LIMIT 1),
  'Someshwar',
  'BRM-SOMESHWAR',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.sub_areas sa
  INNER JOIN public.areas a ON a.id = sa.area_id
  WHERE a.name = 'Baramati' AND sa.name = 'Someshwar'
);

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
SELECT
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'Baramati' LIMIT 1),
  'Supa',
  'BRM-SUPA',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.sub_areas sa
  INNER JOIN public.areas a ON a.id = sa.area_id
  WHERE a.name = 'Baramati' AND sa.name = 'Supa'
);

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
SELECT
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'Baramati' LIMIT 1),
  'Walchandnagar',
  'BRM-WALCHANDNAGAR',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.sub_areas sa
  INNER JOIN public.areas a ON a.id = sa.area_id
  WHERE a.name = 'Baramati' AND sa.name = 'Walchandnagar'
);

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
SELECT
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'Baramati' LIMIT 1),
  'Wanewadi',
  'BRM-WANEWADI',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.sub_areas sa
  INNER JOIN public.areas a ON a.id = sa.area_id
  WHERE a.name = 'Baramati' AND sa.name = 'Wanewadi'
);

INSERT INTO public.sub_areas (id, area_id, name, code, is_active, created_at)
SELECT
  gen_random_uuid(),
  (SELECT id FROM public.areas WHERE name = 'Baramati' LIMIT 1),
  'Zargadwadi',
  'BRM-ZARGADWADI',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.sub_areas sa
  INNER JOIN public.areas a ON a.id = sa.area_id
  WHERE a.name = 'Baramati' AND sa.name = 'Zargadwadi'
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0001',
  'A.A.AKTHOALTEI',
  'GP',
  'BAMS',
  'KGALLI, BARAMATI.TAL-BARAMATI.DIST-PUNE',
  'Baramati',
  '9960350319',
  '2000-06-01',
  '2000-01-24',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'A.A.AKTHOALTEI'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0002',
  'AJINKYARAJE NIMBALKAR',
  'GP',
  'MDDTCD, MBBS',
  'BHIGWAN ROAD,BARAMATI DIST-PUNE',
  'Baramati',
  '9272305950',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'AJINKYARAJE NIMBALKAR'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0003',
  'AJIT AMBARDEKAR',
  'GP',
  'LCEH',
  'BURUDGALLI, BARAMATI ,TAL-BARAMATI, DIST-PUNE',
  'Baramati',
  '9764814885',
  '2000-12-29',
  '2000-01-23',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'AJIT AMBARDEKAR'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0004',
  'AMIT KAVITKE',
  'GP',
  'BAMS',
  'PANGALI, BARAMATI,TAL-BARAMATI, DIST- PUNE',
  'Baramati',
  '9860865876',
  '2000-05-09',
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'AMIT KAVITKE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0005',
  'AMIT KOKARE',
  'PEDIA',
  'MBBS DCH',
  'OLD LIC OFFICE CINEMA RD.,BARAMATI DIST - PUNE',
  'Baramati',
  '9423368767',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'AMIT KOKARE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0006',
  'AMOL BHANDARI',
  'GP',
  'MBBS',
  'INDAPUR CHOWK BARAMATI ,DIST - PUNE',
  'Baramati',
  '9860406608',
  '2000-11-18',
  '2000-05-22',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'AMOL BHANDARI'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0007',
  'AMOL DOSHI',
  'GP',
  'BHMS',
  'OPP.AMBEDKAR STEDIUM,TAL-BARAMATI, DIST-PUNE',
  'Baramati',
  '9822529515',
  '2000-04-20',
  '2000-02-09',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'AMOL DOSHI'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0008',
  'ANAND ATOLE',
  'GP',
  'BHMS',
  'GANESH MARKET, INDAPUR CHOWK, TAL- BARAMATI, DIST-PUNE',
  'Baramati',
  '9422520726',
  '2000-08-24',
  '2000-03-16',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'ANAND ATOLE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0009',
  'ANIL PANSARE',
  'GP',
  'MBBS',
  'RAMGALLI, BARAMATI,TAL-BARAMATI, DIST- PUNE',
  'Baramati',
  '9823140614',
  '2000-06-28',
  '2000-03-09',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'ANIL PANSARE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0010',
  'ANJALI KHADE',
  'PHY',
  'MD',
  'SARAF POTE COMPLEX,BARAMATI DIST- PUNE',
  'Baramati',
  '8149141683',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'ANJALI KHADE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0011',
  'APARNA PAWAR',
  'GP',
  'MBBS DPM',
  'INDAPUR ROAD,BARAMATI DIST-PUNE',
  'Baramati',
  '9225540521',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'APARNA PAWAR'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0012',
  'ASHOK DESHPANDE',
  'GP',
  'MD',
  'ASHOKNAGAR BARAMATI,DIST-PUNE',
  'Baramati',
  NULL,
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'ASHOK DESHPANDE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0013',
  'ASHUTOSH ATOLE',
  'GP',
  'BDS',
  'RANAWARE TAWARS, BARAMATI,TAL- BARAMATI, DIST-PUNE',
  'Baramati',
  '9822596677',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'ASHUTOSH ATOLE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0014',
  'ASHWINKUMAR WAGMODE',
  'GP',
  'MD DCH',
  'INDAPUR RD. BARAMATI ,DIST- PUNE',
  'Baramati',
  '9423532602',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'ASHWINKUMAR WAGMODE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0015',
  'ATUL KHOMANE',
  'PEDIA',
  'MBBS DCH',
  'NEAR S T STAND BARAMATI , DIST PUNE',
  'Baramati',
  '9209801920',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'ATUL KHOMANE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0016',
  'AVINASH ATOLE',
  'GYNI',
  'MBBS DGO',
  'OPP.AMBEDKAR STEDIUM, TAL-BARAMATI, DIST-PUNE',
  'Baramati',
  '9850744192',
  '2000-08-04',
  '2000-12-05',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'AVINASH ATOLE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0017',
  'B.B.NIMBALKAR',
  'ENT',
  'MS ENT',
  'OPP.SILVER JUBLEE HOSPITAL,TAL- BARAMATI, DIST-PUNE',
  'Baramati',
  '9850000633',
  '2000-06-01',
  '2000-07-03',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'B.B.NIMBALKAR'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0018',
  'B.K.SISODIA',
  'PEDIA',
  'MBBS DCH',
  'SARDAR PATEL RD.BARAMATI.DIST-PUNE',
  'Baramati',
  '9860392350',
  '2000-09-22',
  '2000-01-19',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'B.K.SISODIA'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0019',
  'B.N. ATOLE',
  'GP',
  'BHMS',
  'OLD MANDAI INDAPUR CHOWK, TAL- BARAMATI, DIST-PUNE',
  'Baramati',
  '9423081810',
  '2000-06-02',
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'B.N. ATOLE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0020',
  'BHASKAR JEDHE',
  'PEDIA',
  'MD DCH',
  'CINEMA ROAD, BARAMATI,TAL-BARAMATI, DIST-PUNE',
  'Baramati',
  '9822402772',
  '2000-09-28',
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'BHASKAR JEDHE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0021',
  'D.T.LONDHE',
  'GP',
  'BAMS',
  'BURUDGALLI, BARAMATI,TAL-BARAMATI, DIST- PUNE',
  'Baramati',
  '9822047714',
  '2000-07-17',
  '2000-05-10',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'D.T.LONDHE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0022',
  'DEEPA BHANDARI',
  'GYNI',
  'MBBSDGO',
  'INDAPUR CHOWK BARAMATI,DIST - PUNE',
  'Baramati',
  '9860377087',
  '2000-10-15',
  '2000-05-22',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'DEEPA BHANDARI'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0023',
  'GANESH BOKE',
  'PHY',
  'MD PHY',
  'SHIVNANDAN POLYCLINIC,ASHOKNAGAR, BARAMATI,DIST-PUNE',
  'Baramati',
  '8108043103',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'GANESH BOKE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0024',
  'HARSHVARDHAN VHORA',
  'PHY',
  'MD CHEST',
  'CINEMA RD BARAMATI ,DIST - PUNE',
  'Baramati',
  '9822232904',
  '2000-03-15',
  '2000-12-24',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'HARSHVARDHAN VHORA'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0025',
  'HEMANT NAZIRKAPAR',
  'GYNI',
  'MBBS DGO',
  'N GALI, BARAMATI,TAL-BARAMATI, DIST-PUNE',
  'Baramati',
  '9822378998',
  '2000-07-25',
  '2000-12-25',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'HEMANT NAZIRKAPAR'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0026',
  'KESHAV ZARGAD',
  'ENT',
  'MBBS DORL',
  'LAXMAN-SHAKTI COMPLEX, NEAR BALAKMANDIR TAL-BARAMATI, (DIST)',
  'Baramati',
  '9423463392',
  '2000-04-03',
  '2000-04-29',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'KESHAV ZARGAD'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0027',
  'KISHOR RUPANWAR',
  'ORTHO',
  'BS D ORTHO',
  'OLD CINEMA RD. BARAMATI.DIST-PUNE',
  'Baramati',
  '9371276095',
  '2000-10-15',
  '2000-04-01',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'KISHOR RUPANWAR'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0028',
  'M.R.DOSHI',
  'GP',
  'MBBS',
  'MARWAD PETH, TAL-BARAMATI, DIST-PUNE',
  'Baramati',
  '9423221919',
  '2000-01-12',
  '2000-03-13',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'M.R.DOSHI'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0029',
  'M.V.SWAMI',
  'GP',
  'MS',
  'T.C.COLLEGE ROAD,TAL-BARAMATI, DIST- PUNE',
  'Baramati',
  '9823069806',
  '2000-11-07',
  '2000-12-03',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'M.V.SWAMI'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0030',
  'MADHURI MOKASHI',
  'GYNI',
  'MBBS DGO',
  'VALABHAI PATEL MARG, BARAMATI,TAL- BARAMATI, DIST-PUNE',
  'Baramati',
  '9423584065',
  '2000-08-06',
  '2000-01-24',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'MADHURI MOKASHI'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0031',
  'MAHENDRA NAZIRKAR',
  'GP',
  'MD',
  'GUNAWADI ROAD, PANGALLI,TAL-BARAMATI, DIST-PUNE',
  'Baramati',
  '9822459390',
  '2000-07-12',
  '2000-02-19',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'MAHENDRA NAZIRKAR'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0032',
  'TAP',
  'GP',
  'BHMS',
  'SATHENAGAR;KASBA;BARAMATI DIST PUNE',
  'Baramati',
  '9822845343',
  '2000-07-11',
  '2000-07-30',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'TAP'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0033',
  'MANOJ DOSHI',
  'GP',
  'LCEH',
  'PARIJAT CLINIC, KASABA,TAL-BARAMATI, DIST-PUNE',
  'Baramati',
  '9421007700',
  '2000-02-04',
  '2000-11-22',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'MANOJ DOSHI'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0034',
  'MILIND KUMBHAR',
  'GP',
  'BAMS',
  'VITTHAL PLAZA, NIRA RAOD, TAL-BARAMATI, DIST-PUNE',
  'Baramati',
  '9096213993',
  '2000-02-04',
  '2000-02-25',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'MILIND KUMBHAR'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0035',
  'MOHAN GAWADE',
  'GP',
  'BHMS',
  'GUNAWADI ROAD, BARAMATI,TAL-BARAMATI, DIST-PUNE',
  'Baramati',
  '9325310135',
  '2000-01-10',
  '2000-05-31',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'MOHAN GAWADE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0036',
  'N.N.DEVKATE',
  'GP',
  'MBBS',
  'NEAR S.T.STAND, BARAMATITAL-BARAMATI, DIST-PUNE',
  'Baramati',
  '9422357537',
  '2000-01-23',
  '2000-05-20',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'N.N.DEVKATE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0037',
  'NETRA SIKCHI',
  'DENTIST',
  'BDS',
  'MAHAVIR PATH,BARAMATI,DIST-PUNE',
  'Baramati',
  NULL,
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'NETRA SIKCHI'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0038',
  'NILESH KUMBHAR',
  'GP',
  'BHMS',
  'KASABA BARAMATI , DIST-PUNE',
  'Baramati',
  '9960766702',
  '2000-07-21',
  '2000-06-21',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'NILESH KUMBHAR'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0039',
  'NILESH NAIGAONKAR',
  'GP',
  'MS',
  'OPP. COSMOS BANK ,BARAMATI,TAL- BARAMATI, DIST-PUNE',
  'Baramati',
  '9922139964',
  '2000-08-20',
  '2000-07-05',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'NILESH NAIGAONKAR'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0040',
  'P.N.DEVOKATE',
  'GP',
  'MD',
  'INDAPUR RAOD, BARAMATI,TAL-BARAMATI, DIST-PUNE',
  'Baramati',
  '9822351843',
  '2000-09-26',
  '2000-07-02',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'P.N.DEVOKATE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0041',
  'PARESH NAIGAONKAR',
  'GP',
  'BAMS',
  'BHIGWAN RD. BARAMATI.DIST-PUNE',
  'Baramati',
  NULL,
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'PARESH NAIGAONKAR'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0042',
  'PRADEEP VHORA',
  'GP',
  'BDS',
  'BHIGWAN CHOWK,BARAMATI DIST - PUNE',
  'Baramati',
  '982256109',
  '2000-12-30',
  '2000-05-04',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'PRADEEP VHORA'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0043',
  'PRAJAKTA PURANDHARE',
  'GYNI',
  'MD DGO',
  'INDAPUR ROAD, BARAMATI,TAL-BARAMATI, DIST-PUNE',
  'Baramati',
  '9822519792',
  '2000-12-24',
  '2000-01-29',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'PRAJAKTA PURANDHARE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0044',
  'PRASHANT MANDAN',
  'GP',
  'MS',
  'BHIGWAN RAOD, ASHOKNAGAR,TAL- BARAMATI, DIST-PUNE',
  'Baramati',
  '9823069810',
  '2000-11-24',
  '2000-01-01',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'PRASHANT MANDAN'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0045',
  'PRATAP HIRWAY',
  'GP',
  'BAMS',
  'OPP.AMBEDKAR STEDIUM,TAL-BARAMATI, DIST-PUNE',
  'Baramati',
  '9325311123',
  '2000-12-25',
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'PRATAP HIRWAY'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0046',
  'PRITAM VHORPAA',
  'GP',
  'BHMS',
  'NGALI, BARAMATI,TAL-BARAMATI, DIST-PUNE',
  'Baramati',
  '9422005940',
  '2000-04-01',
  '2000-05-02',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'PRITAM VHORPAA'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0047',
  'PRITI JAGATAP',
  'GP',
  'BAMS',
  'OPP SATHENAGAR.BARAMATI.DIST-PUNE',
  'Baramati',
  NULL,
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'PRITI JAGATAP'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0048',
  'R.D.WABALE',
  'GP',
  'MBBS DNB',
  'INDAPUR RAOD, BARAMATI,TAL-BARAMATI, DIST-PUNE',
  'Baramati',
  '9822459414',
  '2000-06-23',
  '2000-06-27',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'R.D.WABALE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0049',
  'R.G.CHOPADE',
  'GP',
  'BAMS',
  'OPP.S.T.STAND, BARAMATI,TAL-BARAMATI, DIST-PUNE',
  'Baramati',
  '9422333306',
  '2000-03-12',
  '2000-02-09',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'R.G.CHOPADE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0050',
  'R.P.RAJE',
  'GP',
  'MD',
  'OPP.SILVER JUBLEE HOSPITAL,TAL- BARAMATI, DIST-PUNE',
  'Baramati',
  '9822668494',
  '2000-02-06',
  '2000-02-25',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'R.P.RAJE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0051',
  'RAJENDRA GAWASPARNAEV',
  'PEDIA',
  'MBBS DCH',
  'IN PLAZA, CINEMA RD.BARAMATI.DIST-PUNE',
  'Baramati',
  '9823036205',
  '2000-12-11',
  '2000-03-01',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'RAJENDRA GAWASPARNAEV'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0052',
  'RAJENDRA KANKE',
  'GP',
  'BAMS',
  'AMRAI, INDAPUR RD,BARAMATI DIST-PUNE',
  'Baramati',
  '9822379018',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'RAJENDRA KANKE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0053',
  'RAJENDRA MUTHA',
  'PEDIA',
  'MD DCH',
  'SHRIRAMGALLI, BARAMATI,TAL-BARAMATI, DIST-PUNE',
  'Baramati',
  '9823017123',
  '2000-12-08',
  '2000-02-14',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'RAJENDRA MUTHA'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0054',
  'RESHMA SARTAPE',
  'GP',
  'BAMS',
  'AMRAI,BARAMATI DIST-PUNE',
  'Baramati',
  NULL,
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'RESHMA SARTAPE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0055',
  'REVATI SANT',
  'ENT',
  'M.S.ENT',
  'INDAPUR CHOWAK BARAMATI ,DIST - PUNE',
  'Baramati',
  '9325022173',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'REVATI SANT'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0056',
  'S.K.DOSHI',
  'GP',
  'LCEH',
  'BHEHIND POST OFFICE,BARAMATI,TAL- BARAMATI, DIST-PUNE',
  'Baramati',
  '9226776603',
  '2000-11-10',
  '2000-03-06',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'S.K.DOSHI'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0057',
  'S.KARANDE PATIL',
  'ORTHO',
  'MBBS D ORTHO',
  'OPP.SILVER JUBLEE HOSPITAL,TAL- BARAMATI, DIST-PUNE',
  'Baramati',
  '9226440790',
  '2000-04-28',
  '2000-07-29',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'S.KARANDE PATIL'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0058',
  'S.T.KHADE',
  'GP',
  'BAMS',
  'VASANTNAGAR, BARAMATI ,TAL-BARAMATI, DIST-PUNE',
  'Baramati',
  '9850596314',
  '2000-03-25',
  '2000-12-15',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'S.T.KHADE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0059',
  'SACHIN BALGUDE',
  'GP',
  'BAMS',
  'KHANDOBANAGAR, BARAMATI,TAL- BARAMATI, DIST-PUNE',
  'Baramati',
  '9890621279',
  '2000-01-02',
  '2000-01-28',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'SACHIN BALGUDE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0060',
  'SANDESH SHAH',
  'GP',
  'BAMS',
  'KHANDOBANAGAR, BARAMATI,TAL- BARAMATI, DIST-PUNE',
  'Baramati',
  '9850843250',
  '2000-08-17',
  '2000-02-28',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'SANDESH SHAH'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0061',
  'SANJAY PAWAR',
  'GP',
  'DHMS',
  'OPP. KRUPA COMPLEX, BHIGWAN CHOWK, BARAMATI (PUNE)',
  'Baramati',
  '9423221909',
  '2000-08-03',
  '2000-03-05',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'SANJAY PAWAR'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0062',
  'SANJAY PURANDHARE',
  'GP',
  'MS',
  'INDAPUR ROAD, BARAMATI,TAL-BARAMATI, DIST-PUNE',
  'Baramati',
  '9422011360',
  '2000-08-30',
  '2000-01-29',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'SANJAY PURANDHARE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0063',
  'SEEMA BANKAR',
  'GP',
  'BAMS',
  'T.C.COLLEGE ROAD, BARAMATI,TAL- BARAMATI, DIST-PUNE',
  'Baramati',
  '9850843250',
  '2000-05-13',
  '2000-03-03',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'SEEMA BANKAR'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0064',
  'SEEMA GAMWUAKSTAANI HE',
  'GYNI',
  'MBBS DGO',
  'OSPITAL, INDAPUR RD .BARAMATI.DIST-PUNE',
  'Baramati',
  '9423579380',
  '2000-12-19',
  '2000-03-01',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'SEEMA GAMWUAKSTAANI HE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0065',
  'SHARAYU DURGUDE',
  'GYNI',
  'MBBS DGO',
  'INDAPUR ROAD BARAMATI , DIST PUNE',
  'Baramati',
  '9860568645',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'SHARAYU DURGUDE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0066',
  'SHASHANK JALAK',
  'PHY',
  'MD PHY',
  'BURUD GALLI BARAMATI ,DIST- PUNE',
  'Baramati',
  '9657760607',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'SHASHANK JALAK'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0067',
  'SHRIKANT RATHI',
  'GP',
  'MS OPTHA',
  'BHIGWAN CHOWK,BARAMATI DIST - PUNE',
  'Baramati',
  NULL,
  '2000-12-12',
  '2000-11-20',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'SHRIKANT RATHI'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0068',
  'SHRIPRASNAEDA SRI DMHAANYGE',
  'GP',
  'MBBS',
  'AL LAB, BARAMATI.TAL-BARAMATI.DIST-PUNE',
  'Baramati',
  '9325382323',
  '2000-09-01',
  '2000-12-16',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'SHRIPRASNAEDA SRI DMHAANYGE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0069',
  'SHRIRANG SOLUNKE',
  'GP',
  'MD PSY',
  'INDAPUR ROAD, BARAMATI,TAL-BARAMATI, DIST-PUNE',
  'Baramati',
  '9890734888',
  '2000-08-15',
  '2000-08-08',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'SHRIRANG SOLUNKE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0070',
  'SHUBHANGI WAGMODE',
  'GP',
  'MD GYN',
  'INDAPUR RD. BARAMATI DIST- PUNE',
  'Baramati',
  '9423532603',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'SHUBHANGI WAGMODE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0071',
  'SMITA BORADE',
  'GP',
  'BAMS',
  'KASABA BARAMATI , DIST-PUNE',
  'Baramati',
  '9226164045',
  '2000-12-13',
  '2000-07-09',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'SMITA BORADE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0072',
  'SOMANATH RAUT',
  'GP',
  'MBBS DOMS.',
  'CINEMA RD. BARAMATI ,DIST - PUNE',
  'Baramati',
  '9850000681',
  '2000-06-01',
  '2000-01-20',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'SOMANATH RAUT'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0073',
  'SUHAS VHORA',
  'GP',
  'BAMS',
  'OLD MANDAI,BARAMATI DIST-PUNE',
  'Baramati',
  '9881019959',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'SUHAS VHORA'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0074',
  'SUHASINI SONAWALE',
  'GP',
  'BHMS',
  'NEAR RELIANCE TOWER, BARAMATITAL- BARAMATI, DIST-PUNE',
  'Baramati',
  '9325311164',
  '2000-10-21',
  '2000-06-15',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'SUHASINI SONAWALE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0075',
  'SURAJ DURGUDE',
  'GP',
  'MS',
  'INDAPUR ROAD ,TAL-BARAMATI ,DIST-PUNE',
  'Baramati',
  '9422347976',
  '2000-11-07',
  '2000-05-19',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'SURAJ DURGUDE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0076',
  'SWAPNIL MAHAJAN',
  'GP',
  'BAMS',
  'GUNAWADI CHOWK,TAL-BARAMATI, DIST- PUNE',
  'Baramati',
  '9923807721',
  '2000-08-21',
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'SWAPNIL MAHAJAN'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0077',
  'TUSHAR GADADE',
  'GP',
  'MD GYN',
  'SHIVNANDAN POLYCLINIC,ASHOKNAGAR, BARAMATI,DIST-PUNE',
  'Baramati',
  '9158992829',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'TUSHAR GADADE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0078',
  'TUSHAR SHINDE',
  'GP',
  'MBBS FCPS',
  'STATION ROAD,BARAMATI DIST -PUNE',
  'Baramati',
  '9823565848',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'TUSHAR SHINDE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0079',
  'UJWAL HINKGHAANTEI',
  'GP',
  'BS D ORTHO',
  'KGALLI, BARAMATI.TAL-BARAMATI.DIST-PUNE',
  'Baramati',
  '9822245158',
  '2000-12-19',
  '2000-06-04',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'UJWAL HINKGHAANTEI'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0080',
  'V S KHADE',
  'GP',
  'BAMS',
  'VASANTNAGAR BARAMATI , DIST PUNE',
  'Baramati',
  '9850596314',
  '2000-09-01',
  '2000-12-15',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'V S KHADE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0081',
  'V.S.NAIGAONKAR',
  'GP',
  'MS',
  'OPP.COSMOS BANK,.BARAMATI.DIST-PUNE',
  'Baramati',
  '9822333506',
  '2000-11-06',
  '2000-06-05',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'V.S.NAIGAONKAR'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0082',
  'VAIBHAV MADANE',
  'GP',
  'MS',
  'BHIGWAN RAOD, SAMARTH HOSPITAL,TAL- BARAMATI, DIST-PUNE',
  'Baramati',
  '9225549010',
  '2000-10-05',
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'VAIBHAV MADANE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0083',
  'VIDYA SHIRKANDE',
  'GP',
  'BHMS',
  'KASBA, BARAMATI DIST-PUNEI',
  'Baramati',
  '9403699941',
  '2000-08-26',
  '2000-03-27',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'VIDYA SHIRKANDE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0084',
  'VIKAS LONKAR',
  'GP',
  'MD',
  'OLD CINEMA RD. BARAMATI.DIST-PUNE',
  'Baramati',
  '9822831840',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'VIKAS LONKAR'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0085',
  'VISHAL GAIKWAD',
  'GP',
  'BHMS',
  'TANDULWADI WES; BARAMATI DIST-PUNE',
  'Baramati',
  '9850565467',
  '2000-08-29',
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'VISHAL GAIKWAD'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0086',
  'VISHAL MEHTA',
  'GP',
  'MD GYN',
  'A/P- CENEMA RD. BARAMATI DIST - PUNE',
  'Baramati',
  '9623459484',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'VISHAL MEHTA'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0087',
  'YOGESH SISODIA',
  'GYNI',
  'MBBS DGO',
  'SARDAR PATEL RD.BARAMATI.DIST-PUNE',
  'Baramati',
  '9860305005',
  '2000-06-12',
  '2000-12-01',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'YOGESH SISODIA'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati MIDC' LIMIT 1),
  'BRM-DOC-0088',
  'AMIT GADHVE',
  'GP',
  'BHMS',
  'BARAMATI MIDC BARAMATI DIST-PUNE',
  'Baramati MIDC',
  '9922110662',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'AMIT GADHVE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati MIDC' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati MIDC' LIMIT 1),
  'BRM-DOC-0089',
  'APARNA BARAL',
  'GP',
  'MBBS',
  'MIDC., BARAMATI DIST - PUNE',
  'Baramati MIDC',
  '9323944026',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'APARNA BARAL'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati MIDC' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati MIDC' LIMIT 1),
  'BRM-DOC-0090',
  'GANESH DHUMAL',
  'GP',
  'BHMS',
  'BARAMATI MIDC TAL-BARAMATI DIST -PUNE',
  'Baramati MIDC',
  '8149228987',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'GANESH DHUMAL'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati MIDC' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati MIDC' LIMIT 1),
  'BRM-DOC-0091',
  'KOKARE RESHMA',
  'GP',
  'BAMS',
  'BARAMATI MIDC, BARAMATI DIST - PUNE',
  'Baramati MIDC',
  NULL,
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'KOKARE RESHMA'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati MIDC' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati MIDC' LIMIT 1),
  'BRM-DOC-0092',
  'RANJEET KADAM',
  'GP',
  'BAMS',
  'BARAMATI MIDC TAL-BARAMATI DIST -PUNE',
  'Baramati MIDC',
  '9881020001',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'RANJEET KADAM'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati MIDC' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati MIDC' LIMIT 1),
  'BRM-DOC-0093',
  'SANDIP SHAH',
  'GP',
  'BAMS',
  'BARAMATI MIDC TAL-BARAMATI DIST -PUNE',
  'Baramati MIDC',
  '9689897949',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'SANDIP SHAH'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati MIDC' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati MIDC' LIMIT 1),
  'BRM-DOC-0094',
  'SMITA ADSUL',
  'PEDIA',
  'MBBS DCH',
  'BARAMATI MIDC,BARAMATI DIST-PUNE',
  'Baramati MIDC',
  '9423465023',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'SMITA ADSUL'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati MIDC' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati MIDC' LIMIT 1),
  'BRM-DOC-0095',
  'VAISHALI KARVEKAR',
  'GP',
  'BAMS',
  'SURYANAGARI;BARAMATI MIDC,DIST- PUNE',
  'Baramati MIDC',
  '9421081850',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'VAISHALI KARVEKAR'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati MIDC' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1),
  'BRM-DOC-0096',
  'VRUSHALI HARKE',
  'GP',
  'BAMS',
  'WADUJKAR ESTT. BHIGWAN RD. ,BARAMATI DIST - PUNE',
  'Baramati',
  '9226437622',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'VRUSHALI HARKE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Baramati MIDC' LIMIT 1),
  'BRM-DOC-0097',
  'VISHWAGANDHA SHINDE',
  'GP',
  'BAMS',
  'MIDC,BARAMATI DIST - PUNE',
  'Baramati MIDC',
  '9860090212',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'VISHWAGANDHA SHINDE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Baramati MIDC' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Bhigwan' LIMIT 1),
  'BRM-DOC-0098',
  'BHARAT BHARNE',
  'GP',
  'BAMS',
  'A/P.BHIGWAN,TAL-INDAPUR, DIST-PUNE',
  'Bhigwan',
  '9922556164',
  '2000-12-20',
  '2000-02-22',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'BHARAT BHARNE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Bhigwan' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Bhigwan' LIMIT 1),
  'BRM-DOC-0099',
  'C.B.KHANAWARE',
  'GP',
  'BAMS',
  'MAIN ROAD, A/P.BHIGWAN,TAL-INDAPUR, DIST-PUNE',
  'Bhigwan',
  '9860141227',
  '2000-07-01',
  '2000-03-07',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'C.B.KHANAWARE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Bhigwan' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Bhigwan' LIMIT 1),
  'BRM-DOC-0100',
  'DADA JAGTAP',
  'GP',
  'BAMS',
  'A/P- BHIGWAN ,TAL – INDAPUR DIST – PUNE',
  'Bhigwan',
  '9890369105',
  '2000-10-20',
  '2000-04-05',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'DADA JAGTAP'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Bhigwan' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Bhigwan' LIMIT 1),
  'BRM-DOC-0101',
  'NYANESHWAR RENUKAR',
  'ORTHO',
  'MS ORTHO',
  'A/P BHIGWAN , TAL INDAPUR , DIST PUNE',
  'Bhigwan',
  '9730448111',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'NYANESHWAR RENUKAR'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Bhigwan' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Bhigwan' LIMIT 1),
  'BRM-DOC-0102',
  'JAYASHREE GANDHI',
  'ORTHO',
  'MBBS DGO',
  'PUNE-SOLAPUR ROAD,=A/P. BHIGWAN, TAL- INDAPUR, DIST-PUNE',
  'Bhigwan',
  '9860304840',
  '2000-02-07',
  '2000-02-08',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'JAYASHREE GANDHI'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Bhigwan' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Bhigwan' LIMIT 1),
  'BRM-DOC-0103',
  'JAYPRAKASH HKHIGAHR SACD',
  'GP',
  'BAMS',
  'HOOL RD, BHIGWAN.TAL-INDAPUR.DIST-PUNE',
  'Bhigwan',
  '9422501796',
  '2000-02-24',
  '2000-04-02',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'JAYPRAKASH HKHIGAHR SACD'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Bhigwan' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Bhigwan' LIMIT 1),
  'BRM-DOC-0104',
  'L.G SHAH .',
  'GP',
  'BAMS',
  'A/P.BHIGWAN ,TAL-INAPUR,DIST-PUNE',
  'Bhigwan',
  '9890030019',
  '2000-10-17',
  '2000-12-18',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'L.G SHAH .'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Bhigwan' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Bhigwan' LIMIT 1),
  'BRM-DOC-0105',
  'MAHAVIR GANDHI',
  'GP',
  'MBBS',
  'PUNE-SOLAPUR ROAD,=A/P. BHIGWAN, TAL- INDAPUR, DIST-PUNE',
  'Bhigwan',
  '9860304840',
  NULL,
  '2000-02-08',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'MAHAVIR GANDHI'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Bhigwan' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Bhigwan' LIMIT 1),
  'BRM-DOC-0106',
  'N.A.KOKARE',
  'GP',
  'BAMS',
  'MAIN RD, BHIGWAN.TAL-INDAPUR.DIST-PUNE',
  'Bhigwan',
  '9881162720',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'N.A.KOKARE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Bhigwan' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Bhigwan' LIMIT 1),
  'BRM-DOC-0107',
  'NITIN KHANAWARE',
  'GP',
  'BAMS',
  'A/P.BHIGWAN, TAL-INDAPUR, DIST-PUNE',
  'Bhigwan',
  '9860645274',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'NITIN KHANAWARE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Bhigwan' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Bhigwan' LIMIT 1),
  'BRM-DOC-0108',
  'IRGE',
  'GP',
  'BDS',
  'A/P BHIGWAN, TAL INDAPUR DIST-PUNE',
  'Bhigwan',
  NULL,
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'IRGE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Bhigwan' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Bhigwan' LIMIT 1),
  'BRM-DOC-0109',
  'PADMA KHARAD',
  'GP',
  'BAMS',
  'HIGH SCHOOL ROAD, A/P.BHIGWAN,TAL- INDAPUR, DIST-PUNE',
  'Bhigwan',
  '9422357501',
  '2000-05-05',
  '2000-04-02',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'PADMA KHARAD'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Bhigwan' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Bhigwan' LIMIT 1),
  'BRM-DOC-0110',
  'PRAKASHHI GMHA SNCE',
  'GP',
  'BAMS',
  'HOOL RD, BHIGWAN.TAL-INDAPUR.DIST-PUNE',
  'Bhigwan',
  '9860488915',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'PRAKASHHI GMHA SNCE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Bhigwan' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Bhigwan' LIMIT 1),
  'BRM-DOC-0111',
  'R.N.HAGAMRAEI',
  'GP',
  'BAMS',
  'N PETH BHIGWAN.TAL-INDAPUR.DIST_PUNE',
  'Bhigwan',
  NULL,
  '2000-06-02',
  '2000-06-05',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'R.N.HAGAMRAEI'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Bhigwan' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Bhigwan' LIMIT 1),
  'BRM-DOC-0112',
  'SANKET MORE',
  'GP',
  'BHMS',
  'A/P – BHIGWAN ,TAL – INDAPUR DIST – PUNE',
  'Bhigwan',
  '9890123512',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'SANKET MORE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Bhigwan' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Bhigwan' LIMIT 1),
  'BRM-DOC-0113',
  'SATISH NAGARE',
  'GP',
  'BAMS',
  'HIGH SCHOOL ROAD, A/P. BHIGWAN,TAL- INDAPUR, DIST-PUNE',
  'Bhigwan',
  '9422341212',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'SATISH NAGARE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Bhigwan' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Bhigwan' LIMIT 1),
  'BRM-DOC-0114',
  'SUJATA WPAUGNHEM-SOODLE',
  'GP',
  'BAMS',
  'APUR RD, BHIGWAN.TAL-INDAPUR.DIST-PUNE',
  'Bhigwan',
  NULL,
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'SUJATA WPAUGNHEM-SOODLE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Bhigwan' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Bhigwan' LIMIT 1),
  'BRM-DOC-0115',
  'VISHAL KOTHARI',
  'GP',
  'BAMS',
  'MANDANWADI, A/P.BHIGWAN,TAL-INDAPUR, DIST-PUNE',
  'Bhigwan',
  '9869497181',
  '2000-03-31',
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'VISHAL KOTHARI'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Bhigwan' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1),
  'BRM-DOC-0116',
  'AMIT BIDWE',
  'ORTHO',
  'MB D ORTHO',
  'OPP. SBI BANK,DAUND,DIST-PUNE',
  'Daund',
  '9822413067',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'AMIT BIDWE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1),
  'BRM-DOC-0117',
  'ANURADHA OWPAPL RAAKIEL',
  'GP',
  'BAMS',
  'WAY GROUND.DAUND.TAL-DAUND.DIST-PUNE',
  'Daund',
  '9422005974',
  '2000-10-25',
  '2000-12-18',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'ANURADHA OWPAPL RAAKIEL'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1),
  'BRM-DOC-0118',
  'BALASAHEB BAYROAGNEGSAHLWE',
  'GP',
  'BAMS',
  'AR COMPLEX,DAUND.TAL-DAUND.DIST-PUNE',
  'Daund',
  '9226796685',
  '2000-10-25',
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'BALASAHEB BAYROAGNEGSAHLWE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1),
  'BRM-DOC-0119',
  'D.S.LONKAR',
  'GP',
  'MD',
  'COLLEGE ROAD, TAL-DAUND, DIST-PUNE',
  'Daund',
  '9422312042',
  '2000-03-22',
  '2000-04-25',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'D.S.LONKAR'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1),
  'BRM-DOC-0120',
  'DEEPAK GIDWANI',
  'GP',
  'MBBS',
  'GANDHI CHOWK, TAL-DAUND, DIST-PUNE',
  'Daund',
  '9423203830',
  '2000-01-15',
  '2000-04-28',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'DEEPAK GIDWANI'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1),
  'BRM-DOC-0121',
  'DEEPAK JADHAV',
  'GP',
  'B.D.S',
  'NEAR C.T. SHAH HOSP.,DAUND DIST – PUNE',
  'Daund',
  NULL,
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'DEEPAK JADHAV'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1),
  'BRM-DOC-0122',
  'J.T.OSWAL',
  'GP',
  'BHMS',
  'NEAR TAHSIL OFFICE, DAUND.DIST-PUNE',
  'Daund',
  '9822566595',
  '2000-01-09',
  '2000-04-26',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'J.T.OSWAL'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1),
  'BRM-DOC-0123',
  'JYOTI JADHAV',
  'GP',
  'BAMS',
  'GOPALWADI ROAD,TAL-DAUND, DIST-PUNE',
  'Daund',
  '9422345130',
  '2000-04-18',
  '2000-02-25',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'JYOTI JADHAV'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1),
  'BRM-DOC-0124',
  'KIRAN KHAVATE',
  'ORTHO',
  'MS ORTHO',
  'NEAR SHALIMAR CHWOK ,DAUND DIST- PUNE',
  'Daund',
  NULL,
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'KIRAN KHAVATE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1),
  'BRM-DOC-0125',
  'KISHOR GIDWANI',
  'GP',
  'BAMS',
  'OPP.CHANDUKAKA SARAF JEWELLAR, DAUND DIST - PUNE',
  'Daund',
  '9028760016',
  '2000-01-15',
  '2000-04-28',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'KISHOR GIDWANI'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1),
  'BRM-DOC-0126',
  'L.S. BIDWE',
  'GP',
  'BAMS',
  'OPP. SBI BANK, TAL-DAUND, DIST-PUNE',
  'Daund',
  '9850025343',
  '2000-10-28',
  '2000-01-24',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'L.S. BIDWE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1),
  'BRM-DOC-0127',
  'M.YALLAMANDA',
  'GP',
  'MBBS',
  'GANDHI CHOWK, TAL-DAUND, DIST-PUNE',
  'Daund',
  NULL,
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'M.YALLAMANDA'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1),
  'BRM-DOC-0128',
  'MAHINDRA JAGDALE',
  'GP',
  'BHMS',
  'BORAWAKENAGAR DAUND , DIST-PUNE',
  'Daund',
  '9960393310',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'MAHINDRA JAGDALE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1),
  'BRM-DOC-0129',
  'NILESH DARADE',
  'GP',
  'MBBS',
  'SHALIMAR CHOWK DAUND,DIST- PUNE',
  'Daund',
  '9226244535',
  '2000-05-05',
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'NILESH DARADE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1),
  'BRM-DOC-0130',
  'P.M.BHANGALE',
  'GYNI',
  'MD DGO',
  'OPP.SBI BANK,TAL-DAUND, DIST-PUNE',
  'Daund',
  '9822450299',
  '2000-04-19',
  '2000-05-16',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'P.M.BHANGALE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1),
  'BRM-DOC-0131',
  'R. J. DATE',
  'GP',
  'BAMS',
  'GOPALWADI RD. DAUND,DIST- PUNE',
  'Daund',
  '9823050760',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'R. J. DATE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1),
  'BRM-DOC-0132',
  'R.P MANE .',
  'GP',
  'MD',
  'HUTATMA CHOWK, DAUND,TAL-DAUND, DIST- PUNE',
  'Daund',
  '9422005993',
  '2000-02-26',
  '2000-06-10',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'R.P MANE .'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1),
  'BRM-DOC-0133',
  'RAHUL PATIL',
  'PHY',
  'MS DNB',
  'SAHAKAR CHOWK DAUND,DIST- PUNE',
  'Daund',
  '9422312071',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'RAHUL PATIL'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1),
  'BRM-DOC-0134',
  'RAJNIKANT GAIKWAD',
  'GP',
  'MS',
  'COLLEGE ROAD, TAL-DAUND, DIST-PUNE',
  'Daund',
  '9226170593',
  '2000-03-07',
  '2000-04-08',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'RAJNIKANT GAIKWAD'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1),
  'BRM-DOC-0135',
  'RAMESH LONKAR',
  'GP',
  'BAMS',
  'SHALIMAR CHOWK DAUND,DIST- PUNE',
  'Daund',
  '9226781558',
  '2000-10-20',
  '2000-11-04',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'RAMESH LONKAR'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1),
  'BRM-DOC-0136',
  'RASIK MEHER',
  'GP',
  'BAMS',
  'KUMBHAR LANE, DAUND,DIST- PUNE',
  'Daund',
  NULL,
  '2000-06-15',
  '2000-12-17',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'RASIK MEHER'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1),
  'BRM-DOC-0137',
  'SANGEETA GAIKWAD',
  'GYNI',
  'MBBS DGO',
  'COLLEGE RAOD,TAL-DAUND, DIST-PUNE',
  'Daund',
  '9423207473',
  '2000-09-10',
  '2000-04-08',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'SANGEETA GAIKWAD'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1),
  'BRM-DOC-0138',
  'SANJEEV KARANDE',
  'GP',
  'MBBS DNB',
  'NEAR SHALIMAR CHWOK ,DAUND DIST - PUNE',
  'Daund',
  '9970317982',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'SANJEEV KARANDE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1),
  'BRM-DOC-0139',
  'SANTOSH BORA',
  'GP',
  'BAMS',
  'KUMBHAR LANE, TAL-DAUND, DIST-PUNE',
  'Daund',
  '9226170638',
  '2000-05-30',
  '2000-05-24',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'SANTOSH BORA'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1),
  'BRM-DOC-0140',
  'SANTOSH JADHAV',
  'GP',
  'BAMS',
  'GOPALWADI, ROAD, TAL-DAUND, DIST-PUNE',
  'Daund',
  '9422345130',
  '2000-11-19',
  '2000-02-25',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'SANTOSH JADHAV'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1),
  'BRM-DOC-0141',
  'SEEMA DNIVEEAKRA DR',
  'GP',
  'BAMS',
  'ATTA MANDIR,DAUND.TAL-DAUND.DIST-PUNE',
  'Daund',
  '9226365884',
  '2000-07-28',
  '2000-07-10',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'SEEMA DNIVEEAKRA DR'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1),
  'BRM-DOC-0142',
  'SHAHAJI JAGDALE',
  'GP',
  'BHMS',
  'NEAR HUTATMA CHOWK ,DAUND DIST-PUNE',
  'Daund',
  '7387629538',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'SHAHAJI JAGDALE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1),
  'BRM-DOC-0143',
  'SHRINIVAS .J',
  'PEDIA',
  'MBBS DCH',
  'NEAR UTI ATM DAUND,DIST- PUNE',
  'Daund',
  '9765899605',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'SHRINIVAS .J'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1),
  'BRM-DOC-0144',
  'SIDDHARTH KULKARNI',
  'GP',
  'MBBS DNB',
  'NEAR SHALIMAR CHWOK ,DAUND DIST - PUNE',
  'Daund',
  '9270738502',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'SIDDHARTH KULKARNI'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1),
  'BRM-DOC-0145',
  'SUNITA KATARIA',
  'GP',
  'MBBS DCH',
  'GANDHI CHOWK, TAL-DAUND, DIST-PUNE',
  'Daund',
  '9422552117',
  '2000-09-16',
  '2000-02-13',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'SUNITA KATARIA'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1),
  'BRM-DOC-0146',
  'SUREKHA BHOSALE',
  'GP',
  'BAMS',
  'GOPALWADI RAOD, TAL-DAUND, DIST-PUNE',
  'Daund',
  '9923316344',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'SUREKHA BHOSALE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1),
  'BRM-DOC-0147',
  'T.B NIMBALKAR .',
  'GYNI',
  'MBBS DCH',
  'SAVARKARNAGAR, DAUND,TAL-DAUND, DIST- PUNE',
  'Daund',
  '9822268239',
  '2000-10-12',
  '2000-06-11',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'T.B NIMBALKAR .'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1),
  'BRM-DOC-0148',
  'YUVRAJ CHAVBAONR',
  'GP',
  'BAMS',
  'AVAKE NAGAR DAUND.TAL-DUND.DIST-PUNE',
  'Daund',
  '9096117113',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'YUVRAJ CHAVBAONR'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Daund' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Kurkumbh' LIMIT 1),
  'BRM-DOC-0149',
  'J.S. DAPHAL',
  'GP',
  'BAMS',
  'PATAS ROAD, A/P.KURKUMBH,TAL-DAUND, DIST-PUNE',
  'Kurkumbh',
  '9422353830',
  '2000-01-25',
  '2000-02-01',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'J.S. DAPHAL'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Kurkumbh' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Kurkumbh' LIMIT 1),
  'BRM-DOC-0150',
  'L.S.BACHUTE',
  'GP',
  'BAMS',
  'DAUND ROAD, A/P.KURKUMBH,TAL-DAUND, DIST-PUNE',
  'Kurkumbh',
  '9822173451',
  '2000-06-23',
  '2000-03-07',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'L.S.BACHUTE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Kurkumbh' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Kurkumbh' LIMIT 1),
  'BRM-DOC-0151',
  'SAMEER SHITOLE',
  'GP',
  'BHMS',
  'A/P KURKUMB,TAL-DAUND DIST-PUNE',
  'Kurkumbh',
  '9960184641',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'SAMEER SHITOLE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Kurkumbh' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Kurkumbh' LIMIT 1),
  'BRM-DOC-0152',
  'SUNIL BHAGWAT',
  'GP',
  'BAMS',
  'DAUND ROAD, A/P.KURKUMBH,TAL-DAUND, DIST-PUNE',
  'Kurkumbh',
  '9860797247',
  '2000-09-16',
  '2000-05-27',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'SUNIL BHAGWAT'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Kurkumbh' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Dorlewadi' LIMIT 1),
  'BRM-DOC-0153',
  'MOHAN NEWSE',
  'GP',
  'DHMS',
  'A/P.DORLEWADI,TAL-BARAMATI, DIST-PUNE',
  'Dorlewadi',
  '9860830690',
  NULL,
  '2000-05-15',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'MOHAN NEWSE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Dorlewadi' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Dorlewadi' LIMIT 1),
  'BRM-DOC-0154',
  'PRAMODNAWALE',
  'GP',
  'BAMS',
  'A/P.DORLEWADI,TAL-BARAMATI, DIST-PUNE',
  'Dorlewadi',
  '9850266864',
  '2000-05-01',
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'PRAMODNAWALE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Dorlewadi' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Dorlewadi' LIMIT 1),
  'BRM-DOC-0155',
  'SAMRUDDHI SHAH',
  'GP',
  'BAMS',
  'A/P.DORLEWADI,TAL-BARAMATI, DIST-PUNE',
  'Dorlewadi',
  '9922139864',
  '2000-10-06',
  '2000-06-19',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'SAMRUDDHI SHAH'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Dorlewadi' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Zargadwadi' LIMIT 1),
  'BRM-DOC-0156',
  'SANTOSH NANAVARE',
  'GP',
  'BHMS',
  'A/P-ZARGADWADI TAL - BARAMATI ,DIST - PUNE',
  'Zargadwadi',
  '9763607660',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'SANTOSH NANAVARE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Zargadwadi' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Dorlewadi' LIMIT 1),
  'BRM-DOC-0157',
  'SATISH WADGAONKAR',
  'GP',
  'BAMS',
  'A/P DORLEWADI,TAL-BARAMATI,DIST-PUNE',
  'Dorlewadi',
  '985084251',
  '2000-03-03',
  '2000-12-16',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'SATISH WADGAONKAR'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Dorlewadi' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Dorlewadi' LIMIT 1),
  'BRM-DOC-0158',
  'ULHASTULE',
  'GP',
  'BAMS',
  'A/P.DORLEWADI,TAL-BARAMATI, DIST-PUNE',
  'Dorlewadi',
  '9822270187',
  '2000-12-15',
  '2000-12-09',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'ULHASTULE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Dorlewadi' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Indapur' LIMIT 1),
  'BRM-DOC-0159',
  'ABHIJIT PHADNIS',
  'GP',
  'MD',
  'KATHAN ROAD,INDAPUR DIST-PUNE',
  'Indapur',
  '9422290153',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'ABHIJIT PHADNIS'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Indapur' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Indapur' LIMIT 1),
  'BRM-DOC-0160',
  'AVINASH PANBUDE',
  'GP',
  'MD',
  'KALTHAN ROAD, INDAPUR,TAL-INDAPUR, DIST-PUNE',
  'Indapur',
  '9850515175',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'AVINASH PANBUDE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Indapur' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Indapur' LIMIT 1),
  'BRM-DOC-0161',
  'KALPANA KHADE',
  'GYNI',
  'MBBS DGO',
  'KALTHAN ROAD, TAL-INDAPUR DIST-PUNE',
  'Indapur',
  '9423004474',
  '2000-07-14',
  '2000-04-30',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'KALPANA KHADE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Indapur' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Indapur' LIMIT 1),
  'BRM-DOC-0162',
  'L.S. KADAM',
  'PEDIA',
  'MDPEAD',
  'KALTHAN RD.,INDAPUR ,TAL – INDAPUR DIST – PUNE',
  'Indapur',
  '9422942120',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'L.S. KADAM'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Indapur' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Indapur' LIMIT 1),
  'BRM-DOC-0163',
  'LAXMAN SAPKAL',
  'GP',
  'BAMS',
  'AKLUJ ROAD,INDAPUR, DIST-PUNE',
  'Indapur',
  NULL,
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'LAXMAN SAPKAL'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Indapur' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Indapur' LIMIT 1),
  'BRM-DOC-0164',
  'MANGESH PATIL',
  'PHY',
  'M.D.PHY',
  'KALTHAN RD INDAPUR ,DIST – PUNE',
  'Indapur',
  '9630698447',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'MANGESH PATIL'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Indapur' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Indapur' LIMIT 1),
  'BRM-DOC-0165',
  'NAMDEO GARDE',
  'PEDIA',
  'MBBS DCH',
  'KALTHAN ROAD, TAL-INDAPUR, DIST-PUNE',
  'Indapur',
  '9881036359',
  '2000-04-12',
  '2000-06-30',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'NAMDEO GARDE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Indapur' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Indapur' LIMIT 1),
  'BRM-DOC-0166',
  'NIKHIL DHAPATE',
  'ORTHO',
  'MPT ORTHO',
  'KALTAN ROAD , INDAPUR DIST PUNE',
  'Indapur',
  '9975174438',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'NIKHIL DHAPATE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Indapur' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Indapur' LIMIT 1),
  'BRM-DOC-0167',
  'PANKAJ GORE',
  'GP',
  'MD',
  'KALTHAN ROAD;INDAPUR ,DIST- PUNE',
  'Indapur',
  '9404240646',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'PANKAJ GORE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Indapur' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Indapur' LIMIT 1),
  'BRM-DOC-0168',
  'RAKESH KARDILE',
  'GP',
  'MBBS D ORTHO',
  'AKLUJ ROAD,INDAPUR, DIST-PUNE',
  'Indapur',
  '9867964728',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'RAKESH KARDILE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Indapur' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Indapur' LIMIT 1),
  'BRM-DOC-0169',
  'RIYAZ PATHAN',
  'GP',
  'BHMS',
  'BARAMATI RD,INDAPUR,DIST-PUNE',
  'Indapur',
  '9823234230',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'RIYAZ PATHAN'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Indapur' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Indapur' LIMIT 1),
  'BRM-DOC-0170',
  'ROHIDAS THORVE',
  'GYNI',
  'MBBS DGO',
  'KATHAN ROAD,INDAPUR DIST-PUNE',
  'Indapur',
  '9890833421',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'ROHIDAS THORVE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Indapur' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Indapur' LIMIT 1),
  'BRM-DOC-0171',
  'S KHABALE',
  'GYNI',
  'MBBS DGO',
  'KALTHAN RD, INDAPUR ,TAL – INDAPUR DIST – PUNE',
  'Indapur',
  '9890368983',
  '2000-02-17',
  '2000-05-23',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'S KHABALE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Indapur' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Indapur' LIMIT 1),
  'BRM-DOC-0172',
  'SAGAR DOSHI',
  'PHY',
  'MBBS DNB',
  'PUNE-SOLAPUR RAOD, TAL-INDAPUR, DIST- PUNE',
  'Indapur',
  '9822520959',
  '2000-12-27',
  '2000-02-25',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'SAGAR DOSHI'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Indapur' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Indapur' LIMIT 1),
  'BRM-DOC-0173',
  'SHAILESH KALEL',
  'GP',
  'BAMS',
  'AKLUJ ROAD,INDAPUR, DIST-PUNE',
  'Indapur',
  '9766034297',
  '2000-05-29',
  '2000-11-09',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'SHAILESH KALEL'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Indapur' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Indapur' LIMIT 1),
  'BRM-DOC-0174',
  'SUHAS SHELKE',
  'ENT',
  'MBBS DLO',
  'A/P – KALTHAN RD. INDAPUR ,DIST- PUNE',
  'Indapur',
  '9923337801',
  '2000-05-29',
  '2000-11-09',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'SUHAS SHELKE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Indapur' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Nimgaon Ketki' LIMIT 1),
  'BRM-DOC-0175',
  'G.R.BANKAR',
  'GP',
  'BAMS',
  'A/P NIMGAON KETKI, TAL-INDAPUR DIST- PUNE',
  'Nimgaon Ketki',
  '9960665428',
  '2000-04-11',
  '2000-11-29',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'G.R.BANKAR'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Nimgaon Ketki' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Nimgaon Ketki' LIMIT 1),
  'BRM-DOC-0176',
  'S. S.DEVKATE',
  'GP',
  'BHMS',
  'A/P NIMGOAN KETKI ,TAL – INDAPUR DIST – PUNE',
  'Nimgaon Ketki',
  '9960012407',
  '2000-06-04',
  '2000-06-06',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'S. S.DEVKATE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Nimgaon Ketki' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Nimgaon Ketki' LIMIT 1),
  'BRM-DOC-0177',
  'VITTHAL GARDI',
  'GP',
  'BHMS',
  'A/P NIMGOAN KETAKI ,TAL – INDAPUR DIST –= PUNE',
  'Nimgaon Ketki',
  '9890370995',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'VITTHAL GARDI'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Nimgaon Ketki' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Anthurne' LIMIT 1),
  'BRM-DOC-0178',
  'NANDKUMAR SONAWANE',
  'GP',
  'BAMS',
  'A/P.ANTHURNE,TAL-INDAPUR, DIST-PUNE',
  'Anthurne',
  '9422011519',
  '2000-04-14',
  '2000-05-30',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'NANDKUMAR SONAWANE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Anthurne' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Anthurne' LIMIT 1),
  'BRM-DOC-0179',
  'S C GARDE',
  'GP',
  'BAMS',
  'A/P ANTHURNE,TAL-INDAPUR,DIST-PUNE',
  'Anthurne',
  NULL,
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'S C GARDE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Anthurne' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Indapur' LIMIT 1),
  'BRM-DOC-0180',
  'DHANANJAY SHITOLE',
  'GP',
  'DHMS',
  'A/P.BHAWANINAGAR ,TAL-INDAPUR, DIST- PUNE',
  'Indapur',
  '9422501796',
  '2000-10-10',
  '2000-12-14',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'DHANANJAY SHITOLE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Indapur' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Indapur' LIMIT 1),
  'BRM-DOC-0181',
  'RAKESH MEHTA',
  'GP',
  'BHMS',
  'A/P - BHAWANINAGAR,TAL – INDAPUR DIST – PUNE',
  'Indapur',
  '9822791730',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'RAKESH MEHTA'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Indapur' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Indapur' LIMIT 1),
  'BRM-DOC-0182',
  'SURAJ VHORAA/',
  'GP',
  'MBBS',
  'P BHAWANINAGAR TAL-INDAPUR DIST-PUNE',
  'Indapur',
  '9422347976',
  '2000-11-07',
  '2000-05-19',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'SURAJ VHORAA/'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Indapur' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Indapur' LIMIT 1),
  'BRM-DOC-0183',
  'TANUJA.SHITOLE',
  'GP',
  'BHMS',
  'A/P.BHAWANINAGAR ,TAL-INDAPUR, DIST- PUNE',
  'Indapur',
  '9422501796',
  '2000-09-14',
  '2000-12-14',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'TANUJA.SHITOLE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Indapur' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Indapur' LIMIT 1),
  'BRM-DOC-0184',
  'VISHAL SAPATE',
  'GYNI',
  'BAMS DGO',
  'A/P BHAWANINAGAR TAL-INDAPUR DIST- PUNE',
  'Indapur',
  '9421023498',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'VISHAL SAPATE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Indapur' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Junction' LIMIT 1),
  'BRM-DOC-0185',
  'CHANDRASHEKAR TENGALE',
  'GYNI',
  'MBBS DGO',
  'A/P JUNCTION TAL INDAPUR ,DIST PUNE',
  'Junction',
  NULL,
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'CHANDRASHEKAR TENGALE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Junction' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Junction' LIMIT 1),
  'BRM-DOC-0186',
  'KAMLAKAR VHORKATE',
  'GP',
  'BAMS',
  'A/P.JUNCTION, TAL-INDAPUR, DIST-PUNE',
  'Junction',
  '9921214995',
  '2000-10-30',
  '2000-05-17',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'KAMLAKAR VHORKATE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Junction' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Lasurne' LIMIT 1),
  'BRM-DOC-0187',
  'RAJENDRA DOSHI',
  'GP',
  'DHMS',
  'A/P LASURNE TAL-INDAPUR.DIST-PUNE',
  'Lasurne',
  '9860003881',
  '2000-03-16',
  '2000-05-05',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'RAJENDRA DOSHI'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Lasurne' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Lasurne' LIMIT 1),
  'BRM-DOC-0188',
  'SUBHASH DOSHI',
  'GP',
  'BAMS',
  'A/P LASURNE TAL-INDAPUR.DIST-PUNE',
  'Lasurne',
  '9860837875',
  '2000-06-26',
  '2000-05-09',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'SUBHASH DOSHI'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Lasurne' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Lasurne' LIMIT 1),
  'BRM-DOC-0189',
  'YOGESHPATIL',
  'GP',
  'BAMS',
  'A/P.LASURNE,TAL-INDAPUR, DIST-PUNE',
  'Lasurne',
  '9970123231',
  '2000-08-18',
  '2000-02-22',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'YOGESHPATIL'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Lasurne' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Sansar' LIMIT 1),
  'BRM-DOC-0190',
  'B.R.KHARE',
  'GP',
  'LCEH',
  'A/P.SANSAR,TAL-INDAPUR, DIST-PUNE',
  'Sansar',
  '9970288189',
  '2000-07-08',
  '2000-05-06',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'B.R.KHARE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Sansar' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Sansar' LIMIT 1),
  'BRM-DOC-0191',
  'GITANJALI POL',
  'GP',
  'BAMS',
  'A/P.SANSAR,TAL-INDAPUR, DIST-PUNE',
  'Sansar',
  '9767535053',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'GITANJALI POL'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Sansar' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Walchandnagar' LIMIT 1),
  'BRM-DOC-0192',
  'ASHA KAWISHWAR',
  'GP',
  'MD',
  'LALPURI ROAD, A/P-WALCHANDNAGAR TAL- INDAPUR, DIST-PUNE',
  'Walchandnagar',
  '9422011280',
  '2000-12-10',
  '2000-11-23',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'ASHA KAWISHWAR'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Walchandnagar' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Walchandnagar' LIMIT 1),
  'BRM-DOC-0193',
  'M.A.HEAG/APD WE',
  'GP',
  'MBBS',
  'ALACHANDNAGAR, TAL-INDAPUR.DIST-PUNE',
  'Walchandnagar',
  '9422088487',
  '2000-09-14',
  '2000-04-17',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'M.A.HEAG/APD WE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Walchandnagar' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Walchandnagar' LIMIT 1),
  'BRM-DOC-0194',
  'N.H.JAGATAP',
  'GP',
  'MBBS',
  'BAZARPETH, A/P.WALCHANDNAGAR,TAL- INDAPUR, DIST-PUNE',
  'Walchandnagar',
  '9423207302',
  '2000-04-01',
  '2000-06-22',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'N.H.JAGATAP'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Walchandnagar' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Walchandnagar' LIMIT 1),
  'BRM-DOC-0195',
  'NITIN LONDHE',
  'ORTHO',
  'MBBS D ORTHO.',
  'A/P- WALCHANDNAGAR ,TAL – INDAPUR DIST – PUNE',
  'Walchandnagar',
  '9970114950',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'NITIN LONDHE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Walchandnagar' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Walchandnagar' LIMIT 1),
  'BRM-DOC-0196',
  'RAJENDRA SHINDE',
  'PEDIA',
  'MBBS DCH',
  'LALPURI RAOD, A/P.WALCHADNAGAR,TAL- INDAPUR, DIST-PUNE',
  'Walchandnagar',
  '9422342445',
  '2000-07-16',
  '2000-06-17',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'RAJENDRA SHINDE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Walchandnagar' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Walchandnagar' LIMIT 1),
  'BRM-DOC-0197',
  'VASANT KANDAAL/KPA WR',
  'GP',
  'MS',
  'ALACHANDNAGAR, TAL-INDAPUR.DIST-PUNE',
  'Walchandnagar',
  '9423002646',
  '2000-12-23',
  '2000-02-23',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'VASANT KANDAAL/KPA WR'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Walchandnagar' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Walchandnagar' LIMIT 1),
  'BRM-DOC-0198',
  'VIKAS SHAH',
  'GYNI',
  'MBBS DGO',
  'LALPURI RAOD, A/P.WALCHADNAGAR,TAL- INDAPUR, DIST-PUNE',
  'Walchandnagar',
  '9422300052',
  '2000-12-22',
  '2000-12-09',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'VIKAS SHAH'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Walchandnagar' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Kambleshwar' LIMIT 1),
  'BRM-DOC-0199',
  'NETAJI NIMBALKAR',
  'GP',
  'BHMS',
  'A/P.KAMBALESHWAR,TAL-BARAMATI, DIST- PUNE',
  'Kambleshwar',
  '9422609870',
  '2000-04-25',
  '2000-04-09',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'NETAJI NIMBALKAR'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Kambleshwar' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Malegaon Factory' LIMIT 1),
  'BRM-DOC-0200',
  'AMAR GAWADE',
  'GP',
  'BHMS',
  'A/P MALEGAON FACTORY, TAL-BARAMATI DIST-PUNE',
  'Malegaon Factory',
  NULL,
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'AMAR GAWADE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Malegaon Factory' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Malegaon Factory' LIMIT 1),
  'BRM-DOC-0201',
  'AMIT JADHAV',
  'GP',
  'BAMS',
  'A/P.MALEGAON ,TAL-BARAMATI, DIST-PUNE',
  'Malegaon Factory',
  '9860828001',
  '2000-04-05',
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'AMIT JADHAV'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Malegaon Factory' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Malegaon Factory' LIMIT 1),
  'BRM-DOC-0202',
  'AMOL JADHAV',
  'GP',
  'BAMS',
  'A/P MALEGAON FACTORY ,TAL-BARAMATI , DIST-PUNE',
  'Malegaon Factory',
  '9665253960',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'AMOL JADHAV'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Malegaon Factory' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Malegaon Factory' LIMIT 1),
  'BRM-DOC-0203',
  'ARVIND PANDHARE',
  'GP',
  'MBBS',
  'A/P MALEGAON FACTORY,TAL-BARAMATI, DIST-PUNE',
  'Malegaon Factory',
  '9881392652',
  '2000-07-27',
  '2000-04-25',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'ARVIND PANDHARE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Malegaon Factory' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Malegaon Factory' LIMIT 1),
  'BRM-DOC-0204',
  'SANDEEP BARGE',
  'GP',
  'BAMS',
  'A/P.MALEGAON FACTORY,TAL-BARAMATI, DIST-PUNE',
  'Malegaon Factory',
  '9423571305',
  '2000-02-10',
  '2000-05-14',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'SANDEEP BARGE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Malegaon Factory' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Sangvi' LIMIT 1),
  'BRM-DOC-0205',
  'BALASAHEB GHORPADE',
  'GP',
  'BAMS',
  'A/P.SANGHAVI, TAL-BARAMATI, DIST-PUNE',
  'Sangvi',
  '9423328626',
  '2000-06-25',
  '2000-02-22',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'BALASAHEB GHORPADE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Sangvi' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Sangvi' LIMIT 1),
  'BRM-DOC-0206',
  'D V KADAM',
  'GP',
  'BAMS',
  'A/P SANGVI, TAL-BARAMATI,DIST-PUNE',
  'Sangvi',
  NULL,
  '2000-12-12',
  '2000-02-28',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'D V KADAM'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Sangvi' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Sangvi' LIMIT 1),
  'BRM-DOC-0207',
  'K.D.PODKULE',
  'GP',
  'DHMS',
  'A/P.SANGAVI,TAL-BARAMATI, DIST-PUNE',
  'Sangvi',
  '9420725181',
  '2000-03-01',
  '2000-05-01',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'K.D.PODKULE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Sangvi' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Sangvi' LIMIT 1),
  'BRM-DOC-0208',
  'MANISHA DESHMUKH',
  'GP',
  'BHMS',
  'A/P.SANGAVI,TAL-BARAMATI, DIST-PUNE',
  'Sangvi',
  '9822118479',
  '2000-06-05',
  '2000-11-24',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'MANISHA DESHMUKH'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Sangvi' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Sangvi' LIMIT 1),
  'BRM-DOC-0209',
  'PRADIP WAGH',
  'GP',
  'BAMS',
  'A/P SANGVI, TAL-BARAMATI,DIST-PUNE',
  'Sangvi',
  NULL,
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'PRADIP WAGH'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Sangvi' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Sangvi' LIMIT 1),
  'BRM-DOC-0210',
  'PRAVIN MULIK',
  'GP',
  'BHMS',
  'A/P.SANGAVI, TAL-BARAMATI, DIST-PUNE',
  'Sangvi',
  '9421057432',
  '2000-11-30',
  '2000-04-20',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'PRAVIN MULIK'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Sangvi' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Malegaon BK' LIMIT 1),
  'BRM-DOC-0211',
  'AJIT SASTE',
  'GP',
  'MBBS',
  'A/P.MALEGAON BK.,TAL-BARAMATI, DIST- PUNE',
  'Malegaon BK',
  '9822307637',
  '2000-11-12',
  '2000-01-01',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'AJIT SASTE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Malegaon BK' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Malegaon BK' LIMIT 1),
  'BRM-DOC-0212',
  'DEEPAK CHAWARE',
  'GP',
  'LCEH.',
  'A/P.MALEGAON BK.,TAL-BARAMATI, DIST- PUNE',
  'Malegaon BK',
  '9860717831',
  '2000-02-19',
  '2000-07-25',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'DEEPAK CHAWARE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Malegaon BK' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Malegaon BK' LIMIT 1),
  'BRM-DOC-0213',
  'MANGESH NEVASE',
  'GP',
  'BAMS',
  'A/P-MALEGAON TAL-BARAMATI DIST- PUNE',
  'Malegaon BK',
  '9970860249',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'MANGESH NEVASE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Malegaon BK' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Malegaon BK' LIMIT 1),
  'BRM-DOC-0214',
  'PRADEEP KUNCHUR',
  'GP',
  '.MBBS',
  'A/P MALEGOAN BK. ,TAL – BARAMATI DIST – PUNE',
  'Malegaon BK',
  NULL,
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'PRADEEP KUNCHUR'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Malegaon BK' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Malegaon BK' LIMIT 1),
  'BRM-DOC-0215',
  'ULHAS SHAH',
  'GP',
  'BAMS',
  'A/P.MALEGAON BK.,TAL-BARAMATI, DIST- PUNE',
  'Malegaon BK',
  NULL,
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'ULHAS SHAH'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Malegaon BK' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Malegaon BK' LIMIT 1),
  'BRM-DOC-0216',
  'VAIBHAV KATE',
  'GP',
  'BAMS',
  'A/P.MALEGAON BK.,TAL-BARAMATI, DIST- PUNE',
  'Malegaon BK',
  '9822095253',
  '2000-09-05',
  '2000-05-05',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'VAIBHAV KATE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Malegaon BK' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Malegaon BK' LIMIT 1),
  'BRM-DOC-0217',
  'VANITA KOKARE',
  'GP',
  'BAMS CGO',
  'A/P MALEGAON (BK),TAL-BARAMATI ,DIST- PUNE',
  'Malegaon BK',
  '9922458646',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'VANITA KOKARE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Malegaon BK' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Malegaon BK' LIMIT 1),
  'BRM-DOC-0218',
  'VIKRANT KATE',
  'GP',
  'BHMS',
  'A/P MALEGAON TAL-BARAMATI DIST-PUNE',
  'Malegaon BK',
  '9890164472',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'VIKRANT KATE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Malegaon BK' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Pandare' LIMIT 1),
  'BRM-DOC-0219',
  'MAHESH KOKARE',
  'GP',
  'BHMS',
  'A/P PANDARE,TAL-BARAMATI ,DIST-PUNE',
  'Pandare',
  '9975957717',
  '2000-02-27',
  '2000-03-16',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'MAHESH KOKARE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Pandare' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Pandare' LIMIT 1),
  'BRM-DOC-0220',
  'NILESH SHAH',
  'GP',
  'BHMS',
  'A/P PANDARE,TAL-BARAMATI ,DIST-PUNE',
  'Pandare',
  '9975395495',
  '2000-11-28',
  '2000-11-21',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'NILESH SHAH'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Pandare' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Pandare' LIMIT 1),
  'BRM-DOC-0221',
  'PRADEEP KHALATE',
  'GP',
  'BAMS',
  'A/P.PANDARE ,TAL-BARAMATI, DIST-PUNE',
  'Pandare',
  '9423584079',
  '2000-11-08',
  '2000-12-27',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'PRADEEP KHALATE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Pandare' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Pandare' LIMIT 1),
  'BRM-DOC-0222',
  'S.D.PATEL',
  'GP',
  'MBBS',
  'A/P PANDARE,TAL-BARAMATI ,DIST-PUNE',
  'Pandare',
  NULL,
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'S.D.PATEL'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Pandare' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Pandare' LIMIT 1),
  'BRM-DOC-0223',
  'SANTOSH DHAIGUDE',
  'GP',
  'BAMS',
  'A/P.PANDARE,TAL-BARAMATI, DIST-PUNE',
  'Pandare',
  '9860247078',
  '2000-05-17',
  '2000-01-19',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'SANTOSH DHAIGUDE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Pandare' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Pandare' LIMIT 1),
  'BRM-DOC-0224',
  'SHIRISH DOSHI',
  'GP',
  'LCEH.',
  'A/P.PANDARE,TAL-BARAMATI, DIST-PUNE',
  'Pandare',
  '9975005700',
  '2000-01-21',
  '2000-05-06',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'SHIRISH DOSHI'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Pandare' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Pandare' LIMIT 1),
  'BRM-DOC-0225',
  'VARSHA SIDHAYE',
  'GP',
  'MBBS DCD',
  'A/P.PANDARE,TAL-BARAMATI, DIST-PUNE',
  'Pandare',
  '9960948612',
  '2000-07-27',
  '2000-12-16',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'VARSHA SIDHAYE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Pandare' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Nira' LIMIT 1),
  'BRM-DOC-0226',
  'ASHISH SHAH',
  'GP',
  'BAMS',
  'BARAMATI ROAD, A/P.NIRA,TAL-PURANDHAR, DIST-PUNE',
  'Nira',
  '9423221050',
  '2000-11-27',
  '2000-05-27',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'ASHISH SHAH'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Nira' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Nira' LIMIT 1),
  'BRM-DOC-0227',
  'DEEPA NIGDE',
  'ENT',
  'MBBS_DORL',
  'A/P NIRA TAL PURANDAR DIST PUNE',
  'Nira',
  NULL,
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'DEEPA NIGDE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Nira' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Nira' LIMIT 1),
  'BRM-DOC-0228',
  'DHANANJAY KUNDALKAR',
  'GP',
  'BAMS',
  'A/P.NIRA, TAL-PURANDHAR, DIST-PUNE',
  'Nira',
  '9860850450',
  '2000-06-01',
  '2000-06-07',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'DHANANJAY KUNDALKAR'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Nira' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Nira' LIMIT 1),
  'BRM-DOC-0229',
  'DILIP BORA',
  'GP',
  'LCEH.',
  'A/P.NIRA, TAL-PURANDHAR, DIST-PUNE',
  'Nira',
  '9423250419',
  '2000-12-06',
  '2000-05-17',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'DILIP BORA'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Nira' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Nira' LIMIT 1),
  'BRM-DOC-0230',
  'KULDIP KAKADE',
  'GP',
  'B.D.S.',
  'A/P – NIRA ,TAL – PURANDAR DIST – PUNE',
  'Nira',
  NULL,
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'KULDIP KAKADE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Nira' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Nira' LIMIT 1),
  'BRM-DOC-0231',
  'LILADHAR MANDAKNALLI',
  'GP',
  'MD',
  'LONAND ROAD, A/P.NIRA,TAL-PURANDHAR, DIST-PUNE',
  'Nira',
  NULL,
  '2000-04-24',
  '2000-04-16',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'LILADHAR MANDAKNALLI'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Nira' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Nira' LIMIT 1),
  'BRM-DOC-0232',
  'MUNOTI TALWALKAR',
  'GP',
  'MD-HOM',
  'A/P NIRA TAL PURANDAR DIST PUNE',
  'Nira',
  NULL,
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'MUNOTI TALWALKAR'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Nira' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Nira' LIMIT 1),
  'BRM-DOC-0233',
  'N.V SHAH',
  'GP',
  'MBBS',
  'S.T.STAND RAOD, A/P.NIRA,TAL-PURANDHAR, DIST-PUNE',
  'Nira',
  '9423240316',
  '2000-10-16',
  '2000-05-10',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'N.V SHAH'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Nira' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Nira' LIMIT 1),
  'BRM-DOC-0234',
  'PRASAD BHATTAD',
  'GP',
  'MBBS DCH',
  'LONAND ROAD, A/P.NIRA,TAL-PURANDHAR, DIST-PUNE',
  'Nira',
  '9226747470',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'PRASAD BHATTAD'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Nira' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Nira' LIMIT 1),
  'BRM-DOC-0235',
  'SANDEEP BHOITE',
  'GP',
  'MBBS DGO',
  'LONAND ROAD, A/P.NIRA,TAL-PURANDHAR, DIST-PUNE',
  'Nira',
  '9423006775',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'SANDEEP BHOITE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Nira' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Nira' LIMIT 1),
  'BRM-DOC-0236',
  'SANDEEP MADANE',
  'GP',
  'BAMS',
  'A/P.NIRA, PUNE ROAD,TAL-PURANDHAR, DIST-PUNE',
  'Nira',
  '9850974385',
  '2000-09-23',
  '2000-06-01',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'SANDEEP MADANE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Nira' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Nira' LIMIT 1),
  'BRM-DOC-0237',
  'SHEKAR RANANAWARE',
  'GP',
  'BHMS',
  'LONAND ROAD,A/P NIRA,TAL-PURANDHAR DIST-PUNE',
  'Nira',
  NULL,
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'SHEKAR RANANAWARE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Nira' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Nira' LIMIT 1),
  'BRM-DOC-0238',
  'SHRENIK SHAH',
  'GP',
  'B.D.S',
  'A/P – NIRA ,TAL – PURANDAR DIST – PUNE',
  'Nira',
  NULL,
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'SHRENIK SHAH'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Nira' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Nira' LIMIT 1),
  'BRM-DOC-0239',
  'VAISHALI MANDAKNALLI',
  'GYNI',
  'MBBS DGO',
  'LONAND ROAD, A/P.NIRA,TAL-PURANDHAR, DIST-PUNE',
  'Nira',
  '9890982876',
  '2000-12-01',
  '2000-04-16',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'VAISHALI MANDAKNALLI'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Nira' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Nira' LIMIT 1),
  'BRM-DOC-0240',
  'VIVEK VAIDYA',
  'GP',
  'DMS',
  'A/P.NIRA,TAL-PURANDHAR, DIST-PUNE',
  'Nira',
  '9860502187',
  '2000-02-11',
  '2000-04-20',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'VIVEK VAIDYA'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Nira' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Korahale' LIMIT 1),
  'BRM-DOC-0241',
  'N.S.YADAV',
  'GP',
  'BAMS',
  'A/P.KORAHLE BK.,TAL-BARAMATI, DIST-PUNE',
  'Korahale',
  '9657863434',
  '2000-12-02',
  '2000-05-28',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'N.S.YADAV'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Korahale' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Korahale' LIMIT 1),
  'BRM-DOC-0242',
  'NITIN M.INGALE',
  'GP',
  'BHMS',
  'A/P.KORAHLE BK.,TAL-BARAMATI, DIST-PUNE',
  'Korahale',
  '9860621834',
  '2000-10-31',
  '2000-01-02',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'NITIN M.INGALE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Korahale' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Korahale' LIMIT 1),
  'BRM-DOC-0243',
  'SACHIN GHORPADE',
  'GP',
  'MBBS',
  'A/P.KORAHLE BK.,TAL-BARAMATI, DIST-PUNE',
  'Korahale',
  '9850242591 9960756792',
  '2000-05-17',
  '2000-07-14',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'SACHIN GHORPADE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Korahale' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Korahale' LIMIT 1),
  'BRM-DOC-0244',
  'SANJAY KOKARE',
  'GP',
  'BHMS',
  'A/P.KORAHLE BK.,TAL-BARAMATI, DIST-PUNE',
  'Korahale',
  '9970746265',
  '2000-02-28',
  '2000-02-27',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'SANJAY KOKARE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Korahale' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Sakharwadi' LIMIT 1),
  'BRM-DOC-0245',
  'JANARDHAN BANKAR',
  'GP',
  'BAMS',
  'A/P.SAKHARWADI, TAL-PHALTAN DIST- SATARA',
  'Sakharwadi',
  '9423265517',
  '2000-06-01',
  '2000-11-24',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'JANARDHAN BANKAR'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Sakharwadi' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Sakharwadi' LIMIT 1),
  'BRM-DOC-0246',
  'DATTA CHAVAN',
  'GP',
  'BAMS',
  'A/P -SAKHARWADI ,TAL- PHALTAN DIST- SATARA',
  'Sakharwadi',
  '9096807170',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'DATTA CHAVAN'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Sakharwadi' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Sakharwadi' LIMIT 1),
  'BRM-DOC-0247',
  'PRAKASH KADAM',
  'GP',
  'BHMS',
  'A/P.SAKHARWADI, TAL-PHALTAN, DIST- SATARA',
  'Sakharwadi',
  '9423229347',
  '2000-08-07',
  '2000-04-16',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'PRAKASH KADAM'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Sakharwadi' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Sakharwadi' LIMIT 1),
  'BRM-DOC-0248',
  'PNRAEVAIRN S K.TA.SLTE',
  'GP',
  'BAMS',
  'AND.SAKHARWADI.TAL-PHALTAN.DIST-PUNE',
  'Sakharwadi',
  '9960320425',
  '2000-12-11',
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'PNRAEVAIRN S K.TA.SLTE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Sakharwadi' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Sakharwadi' LIMIT 1),
  'BRM-DOC-0249',
  'SACHIN NALE',
  'GP',
  'BHMS',
  'A/P SAKHARWADI,TAL-PHALTAN,DIST- SATARA',
  'Sakharwadi',
  '9922818394',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'SACHIN NALE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Sakharwadi' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Sakharwadi' LIMIT 1),
  'BRM-DOC-0250',
  'YUVRAJ NALWADE',
  'GP',
  'BAMS',
  'A/P -SAKHARWADI TAL- PHALTAN,DIST- SATARA',
  'Sakharwadi',
  '9970840147',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'YUVRAJ NALWADE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Sakharwadi' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Someshwar' LIMIT 1),
  'BRM-DOC-0251',
  'G.P SAVALKAR .',
  'GP',
  'BAMS',
  'A/P.SOMESHWAR, TAL-BARAMATI, DIST-PUNE',
  'Someshwar',
  '9423250025',
  '2000-01-01',
  '2000-06-03',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'G.P SAVALKAR .'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Someshwar' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Someshwar' LIMIT 1),
  'BRM-DOC-0252',
  'GANESH JAGATAP',
  'GP',
  'BAMS',
  'A/P.SOMESHWAR,TAL-BARAMATI, DIST-PUNE',
  'Someshwar',
  '9422608769',
  '2000-06-01',
  '2000-11-24',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'GANESH JAGATAP'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Someshwar' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Someshwar' LIMIT 1),
  'BRM-DOC-0253',
  'MANISHA KADAM',
  'GP',
  'BAMS',
  'A/P SOMESHWAR TAL BARAMATI DIST PUNE',
  'Someshwar',
  '9423524961',
  '2000-05-10',
  '2000-04-30',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'MANISHA KADAM'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Someshwar' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Someshwar' LIMIT 1),
  'BRM-DOC-0254',
  'MANOHAR JAGTAP',
  'GP',
  'BAMS',
  'A/P SOMESHWAR,TAL-BARAMATI,DIST-PUNE',
  'Someshwar',
  '9421017536',
  '2000-06-02',
  '2000-05-09',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'MANOHAR JAGTAP'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Someshwar' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Someshwar' LIMIT 1),
  'BRM-DOC-0255',
  'PRADEEP BHOSALE',
  'GP',
  'BAMS',
  'A/P.WANEWADI, (SOMESHWAR),TAL- BARAMATI, DIST-PUNE',
  'Someshwar',
  '9423021578',
  '2000-08-22',
  '2000-02-06',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'PRADEEP BHOSALE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Someshwar' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Someshwar' LIMIT 1),
  'BRM-DOC-0256',
  'RAJKUMAR GAIKWAD',
  'GP',
  'DHMS',
  'A/P SOMESHWAR,TAL-BARAMATI,DIST-PUNE',
  'Someshwar',
  '9423020356',
  '2000-11-06',
  '2000-12-28',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'RAJKUMAR GAIKWAD'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Someshwar' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Someshwar' LIMIT 1),
  'BRM-DOC-0257',
  'S.B.KADAM',
  'GP',
  'DHMS',
  'A/P.SOMESHWAR, TAL-BARAMATI, DIST-PUNE',
  'Someshwar',
  '9423524971',
  '2000-08-04',
  '2000-05-23',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'S.B.KADAM'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Someshwar' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Someshwar' LIMIT 1),
  'BRM-DOC-0258',
  'SACHIN SHAH',
  'GYNI',
  'MBBS DGO',
  'A/P -SOMESHWAR ,TAL- BARAMATI DIST- PUNE',
  'Someshwar',
  NULL,
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'SACHIN SHAH'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Someshwar' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Someshwar' LIMIT 1),
  'BRM-DOC-0259',
  'VILAS KATKAR',
  'GP',
  'BAMS',
  'A/P.WANEWADI SOMESHWAR,TAL- BARAMATI, DIST-PUNE',
  'Someshwar',
  '9423525096',
  '2000-08-09',
  '2000-05-19',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'VILAS KATKAR'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Someshwar' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Wanewadi' LIMIT 1),
  'BRM-DOC-0260',
  'AMOL JAGATAP',
  'GP',
  'BAMS',
  'A/P WANEWADI.TAL-BARAMATI.DIST-PUNE',
  'Wanewadi',
  '9423525032',
  '2000-06-26',
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'AMOL JAGATAP'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Wanewadi' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Jalgaon' LIMIT 1),
  'BRM-DOC-0261',
  'ATUL PISAL',
  'GP',
  'BAMS',
  'A/P JALGAON KP, TAL-BARAMATI',
  'Jalgaon',
  '9921198626',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'ATUL PISAL'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Jalgaon' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Karha-Wagaj' LIMIT 1),
  'BRM-DOC-0262',
  'MANOHAR LAVAND',
  'GP',
  'BHMS',
  'A/P -KARHAWAGAJ TAL- BARAMATI DIST- PUNE',
  'Karha-Wagaj',
  '9960147446',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'MANOHAR LAVAND'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Karha-Wagaj' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Karha-Wagaj' LIMIT 1),
  'BRM-DOC-0263',
  'NANA NICHAL',
  'GP',
  'MD(AYUR)S',
  'A/P -KARHAWAGAJ ,TAL- BARAMATI DIST- PUNE',
  'Karha-Wagaj',
  '9890288274',
  '2000-06-01',
  '2000-05-27',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'NANA NICHAL'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Karha-Wagaj' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Karha-Wagaj' LIMIT 1),
  'BRM-DOC-0264',
  'PUSHPA SUPEKAR',
  'GP',
  'BAMS',
  'A/P – KARHA WAGAJ ,TAL – BARAMATI DIST – PUNE',
  'Karha-Wagaj',
  '9325312770',
  '2000-11-22',
  '2000-03-06',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'PUSHPA SUPEKAR'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Karha-Wagaj' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Morgaon' LIMIT 1),
  'BRM-DOC-0265',
  'CHANDRAKANT HAKE',
  'GP',
  'BAMS',
  'A/P MORGOAN ,TAL – BARAMATI DIST – PUNE',
  'Morgaon',
  '982244533',
  '2000-05-01',
  '2000-03-22',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'CHANDRAKANT HAKE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Morgaon' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Morgaon' LIMIT 1),
  'BRM-DOC-0266',
  'PRADIP SADHALE',
  'GP',
  'BAMS',
  'A/P MORGAON , TAL BARAMATI , DIST PUNE',
  'Morgaon',
  '9922164501',
  '2000-05-31',
  '2000-05-04',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'PRADIP SADHALE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Morgaon' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Morgaon' LIMIT 1),
  'BRM-DOC-0267',
  'PRATAP YEDGE',
  'GP',
  'BHMS',
  'A/P MORGAON TAL-BARAMATI ,DIST-PUNE',
  'Morgaon',
  '9960441197',
  NULL,
  NULL,
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'PRATAP YEDGE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Morgaon' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Morgaon' LIMIT 1),
  'BRM-DOC-0268',
  'SANTOSH GOLANDE',
  'GP',
  'BHMS',
  'A/P MORGOAN ,TAL – BARAMATI DIST – PUNE',
  'Morgaon',
  '9850258584',
  '2000-07-26',
  '2000-05-09',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'SANTOSH GOLANDE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Morgaon' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Supa' LIMIT 1),
  'BRM-DOC-0269',
  'ANKUSH SALUNKE',
  'GP',
  'MBBS',
  'A/P – SUPA TAL – BARAMATI ,DIST - PUNE',
  'Supa',
  '9860635946',
  '2000-09-28',
  '2000-04-03',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'ANKUSH SALUNKE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Supa' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Supa' LIMIT 1),
  'BRM-DOC-0270',
  'GANESH LONAKAR',
  'GP',
  'BAMS',
  'A/P – SUPA TAL – BARAMATI,DIST - PUNE',
  'Supa',
  '9860288599',
  '2000-12-07',
  '2000-03-06',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'GANESH LONAKAR'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Supa' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Supa' LIMIT 1),
  'BRM-DOC-0271',
  'RAHUL POMAN',
  'GP',
  'BHMS',
  'A/P – SUPA TAL – BARAMATI ,DIST - PUNE',
  'Supa',
  '9422259043',
  '2000-01-30',
  '2000-07-07',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'RAHUL POMAN'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Supa' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Supa' LIMIT 1),
  'BRM-DOC-0272',
  'SHAUKAT SHAIKH',
  'GP',
  'BAMS',
  'A/P SUPA TAL-BARAMATI ,DIST-PUNE',
  'Supa',
  '9860358038',
  '2000-01-21',
  '2000-02-06',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'SHAUKAT SHAIKH'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Supa' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Supa' LIMIT 1),
  'BRM-DOC-0273',
  'SHREEPRASAD WABLE',
  'GP',
  'BAMS',
  'A/P – SUPA TAL – BARAMATI ,DIST - PUNE',
  'Supa',
  '9970939630',
  '2000-09-27',
  '2000-05-11',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'SHREEPRASAD WABLE'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Supa' LIMIT 1
    )
);

INSERT INTO public.doctors (
  id, sub_area_id, doctor_code, full_name, speciality, qualification,
  address, city, mobile, birthday, marriage_anniversary,
  master_list_complete, is_active, created_at
)
SELECT
  gen_random_uuid(),
  (SELECT sa.id FROM public.sub_areas sa
   INNER JOIN public.areas a ON a.id = sa.area_id
   WHERE a.name = 'Baramati' AND sa.name = 'Supa' LIMIT 1),
  'BRM-DOC-0274',
  'UDAY KUTWAL',
  'GP',
  'BAMS',
  'A/P – SUPA TAL – BARAMATI ,DIST - PUNE',
  'Supa',
  '9422266092',
  '2000-07-31',
  '2000-12-26',
  true,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctors d
  WHERE d.full_name = 'UDAY KUTWAL'
    AND d.sub_area_id = (
      SELECT sa.id FROM public.sub_areas sa
      INNER JOIN public.areas a ON a.id = sa.area_id
      WHERE a.name = 'Baramati' AND sa.name = 'Supa' LIMIT 1
    )
);

COMMIT;
