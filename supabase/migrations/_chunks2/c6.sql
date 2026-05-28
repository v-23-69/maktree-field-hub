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

COMMIT;