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

COMMIT;
