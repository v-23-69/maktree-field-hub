/** Roll up raw doctor.speciality values into standard e-detailing category codes. */

export type CanonicalCategory = {
  code: string
  name: string
}

const RULES: Array<{ code: string; name: string; test: (s: string) => boolean }> = [
  { code: 'ENT', name: 'ENT', test: s => /^ENT$/.test(s) || /\bENT\b/.test(s) },
  { code: 'ORTHO', name: 'Orthopedics', test: s => /ORTHO|OTRHO/.test(s) },
  {
    code: 'GYNI',
    name: 'Gynecology',
    test: s => /GYN|GYNE|DGO|OBSTET|GYNAEC|GYNI/.test(s),
  },
  {
    code: 'PEDIA',
    name: 'Pediatrics',
    test: s =>
      /PEDIA|PEDIATRICIAN|GP-PEDIA|^PED\b|DCH|PAED/.test(s) ||
      /^PEDI/.test(s),
  },
  { code: 'GASTRO', name: 'Gastroenterology', test: s => /GASTRO/.test(s) },
  {
    code: 'SURGEON',
    name: 'General Surgery',
    test: s => /SURG|PROCTO|SUGRON/.test(s),
  },
  { code: 'CHEST', name: 'Chest / Pulmonology', test: s => /CHEST|PULMO/.test(s) },
  {
    code: 'AYURVEDA',
    name: 'Ayurveda (BAMS)',
    test: s => /AYU|BAMS|BHMS|DHMS/.test(s),
  },
  { code: 'CARDIO', name: 'Cardiology', test: s => /CARDIO/.test(s) },
  { code: 'DERMA', name: 'Dermatology', test: s => /DERMA|DERM\b/.test(s) },
  { code: 'OPHTHAL', name: 'Ophthalmology', test: s => /OPHTHAL|OPTH/.test(s) },
  {
    code: 'MEDICINE',
    name: 'Medicine (MD)',
    test: s => /^MD[\s.]|MD MEDICINE/.test(s) && !/AYU|BAMS/.test(s),
  },
  {
    code: 'GP',
    name: 'General Physician (GP)',
    test: s =>
      /^GP\b|GENERAL PHY|FAMILY PHY|PHYSICIAN|^PHY$|^GG$|^MBBS$/.test(s),
  },
]

const CANONICAL_BY_CODE = new Map(
  RULES.map(r => [r.code, { code: r.code, name: r.name }]),
)

export function normalizeDoctorSpeciality(
  raw: string | null | undefined,
): CanonicalCategory | null {
  const s = (raw ?? '').trim().toUpperCase()
  if (!s) return null
  for (const rule of RULES) {
    if (rule.test(s)) return { code: rule.code, name: rule.name }
  }
  return null
}

export function listCanonicalCategories(): CanonicalCategory[] {
  return RULES.map(r => ({ code: r.code, name: r.name }))
}

export function canonicalCategoryName(code: string): string {
  return CANONICAL_BY_CODE.get(code)?.name ?? code
}
