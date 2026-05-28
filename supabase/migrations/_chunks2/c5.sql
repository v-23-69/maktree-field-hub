BEGIN;
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

COMMIT;