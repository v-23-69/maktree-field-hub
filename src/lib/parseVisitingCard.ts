import { supabase } from '@/lib/supabase'
import type {
  CapturedCardImage,
  DoctorEntrySource,
  ParsedVisitingCardDoctor,
  VisitingCardImage,
  VisitingCardIntake,
} from '@/lib/visitingCard'
import { emptyParsedDoctor, normalizeIndianMobile } from '@/lib/visitingCard'

type ParseResponse = {
  doctors?: Array<Partial<ParsedVisitingCardDoctor>>
  card_images?: VisitingCardImage[]
  error?: string
}

function asDoctor(row: Partial<ParsedVisitingCardDoctor>): ParsedVisitingCardDoctor {
  const base = emptyParsedDoctor()
  return {
    ...base,
    full_name: (row.full_name ?? '').trim(),
    speciality: (row.speciality ?? '').trim(),
    qualification: (row.qualification ?? '').trim(),
    hospital_name: (row.hospital_name ?? '').trim(),
    address: (row.address ?? '').trim(),
    city: (row.city ?? '').trim(),
    mobile: normalizeIndianMobile(row.mobile ?? ''),
    email: (row.email ?? '').trim(),
  }
}

/** Standalone so OCR continues after Android remounts the page when the camera closes. */
export async function parseVisitingCard(p: {
  source: Exclude<DoctorEntrySource, 'manual'>
  images: CapturedCardImage[]
}): Promise<VisitingCardIntake> {
  if (!supabase) throw new Error('Supabase not configured')
  if (p.images.length === 0) throw new Error('Capture at least one visiting-card photo.')

  const { data, error } = await supabase.functions.invoke<ParseResponse>('parse-visiting-card', {
    body: {
      source: p.source,
      images: p.images.map(img => ({
        side: img.side,
        mime: img.mime,
        base64: img.base64,
      })),
    },
  })

  if (data?.error) throw new Error(data.error)
  if (error) {
    let message = error.message || 'Could not read the visiting card.'
    const ctx = (error as { context?: Response }).context
    if (ctx && typeof ctx.json === 'function') {
      try {
        const body = (await ctx.json()) as ParseResponse
        if (body?.error) message = body.error
      } catch {
        /* keep default */
      }
    }
    throw new Error(message)
  }

  const doctors = (data?.doctors ?? []).map(asDoctor).filter(d => d.full_name || d.mobile || d.hospital_name)
  return {
    source: p.source,
    images: Array.isArray(data?.card_images) ? data.card_images : [],
    doctors: doctors.length > 0 ? doctors : [emptyParsedDoctor()],
  }
}
