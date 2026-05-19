/** Territory (parent area) and sub-area labels for a doctor row. */
export function doctorTerritoryLabels(
  doctor?: { sub_area?: { name?: string; area?: { name?: string } } | null } | null,
): { territory: string; area: string } {
  const sub = doctor?.sub_area
  return {
    territory: sub?.area?.name?.trim() || '—',
    area: sub?.name?.trim() || '—',
  }
}
