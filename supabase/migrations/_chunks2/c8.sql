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

COMMIT;