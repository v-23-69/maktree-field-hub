import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type CardSide = 'front' | 'back'

type IncomingImage = {
  side?: CardSide
  mime?: string
  base64?: string
}

type ParsedDoctor = {
  full_name: string
  speciality: string
  qualification: string
  hospital_name: string
  address: string
  city: string
  mobile: string
  email: string
}

const OCR_PROMPT = `You extract doctor details from Indian medical visiting-card photos.

Rules:
- Use ONLY text visible on the card image(s). Never invent names, numbers, or emails.
- Front-only cards are valid. If a back image is also provided, merge both sides into one card.
- If the card lists TWO doctors (same clinic/hospital, two names), return two objects.
- Do not split one doctor into two. Qualifications like MBBS, MD, MS are not a second doctor.
- speciality: map printed terms (e.g. Physician, Gynaecologist, Pediatrician, ENT, Ortho) to a short speciality. If none is printed, use "".
- mobile: digits only, Indian 10-digit if possible. Strip +91 or leading 0.
- address: clinic/hospital street address. city: city/town only.
- hospital_name: clinic, hospital, or nursing home name.
- Return strict JSON with this shape:
{"doctors":[{"full_name":"","speciality":"","qualification":"","hospital_name":"","address":"","city":"","mobile":"","email":""}]}`

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function stripDataUrl(raw: string): string {
  const trimmed = raw.trim()
  const comma = trimmed.indexOf(',')
  if (trimmed.startsWith('data:') && comma !== -1) return trimmed.slice(comma + 1)
  return trimmed
}

async function sha1Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(value))
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('')
}

async function uploadToCloudinary(
  image: IncomingImage,
  folder: string,
): Promise<{ url: string; public_id: string; side: CardSide }> {
  const cloud = Deno.env.get('CLOUDINARY_CLOUD_NAME')?.trim()
  const apiKey = Deno.env.get('CLOUDINARY_API_KEY')?.trim()
  const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET')?.trim()
  const unsignedPreset = Deno.env.get('CLOUDINARY_UPLOAD_PRESET')?.trim()
  if (!cloud) throw new Error('Cloudinary is not configured (CLOUDINARY_CLOUD_NAME).')

  const b64 = stripDataUrl(image.base64 ?? '')
  if (!b64) throw new Error('Photo data is missing.')
  const mime = image.mime?.startsWith('image/') ? image.mime : 'image/jpeg'
  const side: CardSide = image.side === 'back' ? 'back' : 'front'
  const dataUri = `data:${mime};base64,${b64}`

  const form = new FormData()
  form.append('file', dataUri)
  form.append('folder', folder)
  form.append('context', `side=${side}`)

  if (unsignedPreset) {
    form.append('upload_preset', unsignedPreset)
  } else {
    if (!apiKey || !apiSecret) {
      throw new Error('Cloudinary is not configured (API key/secret or upload preset).')
    }
    const timestamp = Math.floor(Date.now() / 1000)
    const toSign = `context=side=${side}&folder=${folder}&timestamp=${timestamp}${apiSecret}`
    form.append('api_key', apiKey)
    form.append('timestamp', String(timestamp))
    form.append('signature', await sha1Hex(toSign))
  }

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
    method: 'POST',
    body: form,
  })
  const payload = await res.json()
  if (!res.ok || !payload?.secure_url) {
    throw new Error(payload?.error?.message || 'Cloudinary upload failed.')
  }
  return {
    url: payload.secure_url as string,
    public_id: (payload.public_id as string) ?? '',
    side,
  }
}

function extractJson(text: string): { doctors?: Array<Partial<ParsedDoctor>> } {
  const trimmed = text.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const raw = fenced?.[1]?.trim() ?? trimmed
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return { doctors: [] }
  return JSON.parse(raw.slice(start, end + 1))
}

function cleanDoctor(row: Partial<ParsedDoctor>): ParsedDoctor {
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
  return {
    full_name: str(row.full_name),
    speciality: str(row.speciality),
    qualification: str(row.qualification),
    hospital_name: str(row.hospital_name),
    address: str(row.address),
    city: str(row.city),
    mobile: str(row.mobile).replace(/\D/g, ''),
    email: str(row.email),
  }
}

async function parseWithGemini(images: IncomingImage[]): Promise<ParsedDoctor[]> {
  const apiKey = Deno.env.get('GEMINI_API_KEY')?.trim()
  if (!apiKey) throw new Error('OCR is not configured (GEMINI_API_KEY).')

  const parts: Array<Record<string, unknown>> = [{ text: OCR_PROMPT }]
  for (const img of images) {
    const data = stripDataUrl(img.base64 ?? '')
    if (!data) continue
    parts.push({
      inlineData: {
        mimeType: img.mime?.startsWith('image/') ? img.mime : 'image/jpeg',
        data,
      },
    })
  }
  if (parts.length < 2) throw new Error('No visiting-card photo to read.')

  const models = ['gemini-2.0-flash', 'gemini-1.5-flash']
  let lastError = 'Gemini request failed.'
  for (const model of models) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        }),
      },
    )
    const payload = await res.json()
    if (!res.ok) {
      lastError = payload?.error?.message || lastError
      continue
    }
    const text =
      payload?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('\n') ?? ''
    const parsed = extractJson(text)
    const doctors = (parsed.doctors ?? []).map(cleanDoctor).filter(d => d.full_name || d.mobile || d.hospital_name)
    return doctors.slice(0, 4)
  }
  throw new Error(lastError)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonResponse({ error: 'Not authenticated' }, 401)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return jsonResponse({ error: 'Not authenticated' }, 401)

    const { data: profile, error: profileErr } = await supabase
      .from('users')
      .select('id, role')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (profileErr) throw profileErr
    if (!profile || !['mr', 'manager', 'admin'].includes(profile.role)) {
      return jsonResponse({ error: 'Permission denied' }, 403)
    }

    const body = await req.json().catch(() => ({})) as { images?: IncomingImage[]; source?: string }
    const images = Array.isArray(body.images) ? body.images.slice(0, 2) : []
    if (images.length === 0) return jsonResponse({ error: 'Capture at least one visiting-card photo.' }, 400)

    for (const img of images) {
      const b64 = stripDataUrl(img.base64 ?? '')
      const approxBytes = Math.floor((b64.length * 3) / 4)
      if (approxBytes > 4_500_000) {
        return jsonResponse({ error: 'Photo is too large. Capture the card again from a bit further away.' }, 413)
      }
    }

    const folder = `maktree/visiting-cards/${profile.id}`
    const card_images = await Promise.all(images.map(img => uploadToCloudinary(img, folder)))
    const doctors = await parseWithGemini(images)

    return jsonResponse({
      doctors,
      card_images,
      source: body.source === 'upload' ? 'upload' : 'camera',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not read the visiting card.'
    return jsonResponse({ error: message }, 400)
  }
})
