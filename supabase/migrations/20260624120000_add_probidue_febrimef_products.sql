-- Add Probidue Susp and Febrimef Susp with PTR values for DCR monthly support calculations.

INSERT INTO public.products (name, description, category, is_active, ptr)
SELECT 'Probidue Susp', null, 'Suspension', true, 36.57
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Probidue Susp');

INSERT INTO public.products (name, description, category, is_active, ptr)
SELECT 'Febrimef Susp', null, 'Suspension', true, 50.25
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Febrimef Susp');

UPDATE public.products SET ptr = 36.57, category = 'Suspension', is_active = true WHERE name = 'Probidue Susp';
UPDATE public.products SET ptr = 50.25, category = 'Suspension', is_active = true WHERE name = 'Febrimef Susp';
