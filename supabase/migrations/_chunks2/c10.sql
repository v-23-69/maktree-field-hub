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

COMMIT;