-- Remove e-detailing categories that are not present in active doctors' specialities.

DELETE FROM public.e_detailing_folders f
WHERE f.parent_id IS NULL
  AND f.is_category = true
  AND f.category_code IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.doctors d
    WHERE d.is_active = true
      AND d.speciality IS NOT NULL
      AND trim(d.speciality) <> ''
      AND upper(trim(d.speciality)) = f.category_code
  );

-- Re-sync folders from doctors only (idempotent)
SELECT public.sync_e_detailing_categories_from_doctors();
