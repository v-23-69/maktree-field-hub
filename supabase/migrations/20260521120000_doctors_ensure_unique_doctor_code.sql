-- Prevent 409 conflicts when doctor_code is blank or NULL (multiple rows violated unique constraint).
-- MR/admin inserts often omitted doctor_code or used ''.

CREATE OR REPLACE FUNCTION public.fn_doctors_ensure_doctor_code()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.doctor_code IS NULL OR length(trim(NEW.doctor_code::text)) = 0 THEN
    NEW.doctor_code := 'MR' || upper(replace(gen_random_uuid()::text, '-', ''));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_doctors_ensure_doctor_code ON public.doctors;
CREATE TRIGGER trg_doctors_ensure_doctor_code
  BEFORE INSERT OR UPDATE OF doctor_code ON public.doctors
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_doctors_ensure_doctor_code();

UPDATE public.doctors d
SET doctor_code = 'MR' || upper(replace(gen_random_uuid()::text, '-', ''))
WHERE d.doctor_code IS NULL OR trim(d.doctor_code::text) = '';
