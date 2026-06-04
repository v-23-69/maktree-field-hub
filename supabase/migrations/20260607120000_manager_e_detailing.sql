-- Manager E-Detailing: category folders + visualization images (storage: visualizations)

CREATE TABLE IF NOT EXISTS public.e_detailing_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES public.e_detailing_folders(id) ON DELETE CASCADE,
  name text NOT NULL,
  category_code text,
  is_category boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT e_detailing_folders_name_trim CHECK (char_length(trim(name)) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS e_detailing_folders_category_code_uq
  ON public.e_detailing_folders (category_code)
  WHERE category_code IS NOT NULL AND parent_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_e_detailing_folders_parent
  ON public.e_detailing_folders (parent_id);

CREATE TABLE IF NOT EXISTS public.e_detailing_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id uuid REFERENCES public.e_detailing_folders(id) ON DELETE SET NULL,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  file_size bigint,
  sort_order int NOT NULL DEFAULT 0,
  title text,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT e_detailing_media_path_uq UNIQUE (storage_path)
);

CREATE INDEX IF NOT EXISTS idx_e_detailing_media_folder
  ON public.e_detailing_media (folder_id);

ALTER TABLE public.e_detailing_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.e_detailing_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS e_detailing_folders_rw ON public.e_detailing_folders;
CREATE POLICY e_detailing_folders_rw ON public.e_detailing_folders
  FOR ALL TO authenticated
  USING (public.current_user_role() IN ('manager', 'admin'))
  WITH CHECK (public.current_user_role() IN ('manager', 'admin'));

DROP POLICY IF EXISTS e_detailing_media_rw ON public.e_detailing_media;
CREATE POLICY e_detailing_media_rw ON public.e_detailing_media
  FOR ALL TO authenticated
  USING (public.current_user_role() IN ('manager', 'admin'))
  WITH CHECK (public.current_user_role() IN ('manager', 'admin'));

-- Seed doctor-category folders (idempotent)
INSERT INTO public.e_detailing_folders (name, category_code, is_category, sort_order, parent_id)
SELECT v.name, v.code, true, v.ord, NULL
FROM (VALUES
  ('General Physician (GP)', 'GP', 1),
  ('Orthopedics', 'ORTHO', 2),
  ('Gynecology', 'GYNI', 3),
  ('Pediatrics', 'PEDIA', 4),
  ('Cardiology', 'CARDIO', 5),
  ('Dermatology', 'DERMA', 6),
  ('ENT', 'ENT', 7),
  ('Ophthalmology', 'OPHTHAL', 8),
  ('Psychiatry', 'PSYCH', 9),
  ('General Surgery', 'SURGEON', 10),
  ('Nephrology', 'NEPHRO', 11),
  ('Gastroenterology', 'GASTRO', 12),
  ('Urology', 'URO', 13),
  ('Oncology', 'ONCO', 14),
  ('Pulmonology', 'PULMO', 15),
  ('Anesthesiology', 'ANAE', 16),
  ('Radiology', 'RADIO', 17),
  ('Neurology', 'NEURO', 18),
  ('Diabetology', 'DIAB', 19),
  ('Dental', 'DENTAL', 20)
) AS v(name, code, ord)
WHERE NOT EXISTS (
  SELECT 1 FROM public.e_detailing_folders f WHERE f.category_code = v.code AND f.parent_id IS NULL
);

-- Storage bucket for visualization images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'visualizations',
  'visualizations',
  true,
  15728640,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS visualizations_read ON storage.objects;
CREATE POLICY visualizations_read ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'visualizations');

DROP POLICY IF EXISTS visualizations_manager_insert ON storage.objects;
CREATE POLICY visualizations_manager_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'visualizations'
    AND public.current_user_role() IN ('manager', 'admin')
  );

DROP POLICY IF EXISTS visualizations_manager_update ON storage.objects;
CREATE POLICY visualizations_manager_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'visualizations'
    AND public.current_user_role() IN ('manager', 'admin')
  );

DROP POLICY IF EXISTS visualizations_manager_delete ON storage.objects;
CREATE POLICY visualizations_manager_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'visualizations'
    AND public.current_user_role() IN ('manager', 'admin')
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.e_detailing_folders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.e_detailing_media TO authenticated;
