/** Hide internal codes (MKT-DOC-*, MRC*, long hex) from user-facing labels. */
export function stripInternalCodes(text: string | null | undefined): string {
  if (!text) return ''
  return text
    .replace(/\s*·\s*MKT-DOC-[A-Z0-9-]+/gi, '')
    .replace(/\s*·\s*MRC[A-Z0-9]+/gi, '')
    .replace(/\s*\(\s*MKT-DOC-[A-Z0-9-]+\s*\)/gi, '')
    .replace(/\s*\(\s*MRC[A-Z0-9]+\s*\)/gi, '')
    .replace(/\s*MKT-DOC-[A-Z0-9-]+\s*/gi, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

export function formatDoctorLabel(
  name: string | null | undefined,
  speciality?: string | null,
): string {
  const n = stripInternalCodes(name) || 'Doctor'
  const spec = speciality?.trim()
  return spec ? `${n} · ${spec}` : n
}

export function formatPersonOption(name: string, _employeeCode?: string | null): string {
  return stripInternalCodes(name) || name
}
