-- PTR (price-to-retailer) values for MakTree products — monthly support rupee totals.

-- Clavigram Forte row becomes explicit 30 ml SKU (same product_id, preserves FKs on past DCRs).
UPDATE public.products SET ptr = 100.57 WHERE name IN ('Clavigram Forte', 'Clavigram Fort 30 ml');
UPDATE public.products SET name = 'Clavigram Fort 30 ml' WHERE name = 'Clavigram Forte';

INSERT INTO public.products (name, description, category, is_active, ptr)
SELECT 'Clavigram Fort 60 ml', null, null, true, 188.95
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Clavigram Fort 60 ml');

INSERT INTO public.products (name, description, category, is_active, ptr)
SELECT 'Shelciss Tab', null, null, true, 118.64
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Shelciss Tab');

UPDATE public.products SET ptr = 146.31 WHERE name = 'Clavigram 625';
UPDATE public.products SET ptr = 114.28 WHERE name = 'Duegut';
UPDATE public.products SET ptr = 75.42 WHERE name = 'Serohelp';
UPDATE public.products SET ptr = 120.38 WHERE name = 'Shelciss Plus';
UPDATE public.products SET ptr = 172.95 WHERE name = 'Shelciss-OA';
UPDATE public.products SET ptr = 92.85 WHERE name = 'Laxihelp-Plus';
UPDATE public.products SET ptr = 99.04 WHERE name = 'Torchduce';
UPDATE public.products SET ptr = 118.00 WHERE name = 'Makrelief';
