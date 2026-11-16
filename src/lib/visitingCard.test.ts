import { describe, expect, it } from 'vitest'
import {
  cardImagesFromPayload,
  composeDoctorAddress,
  entrySourceFromPayload,
  normalizeIndianMobile,
} from '@/lib/visitingCard'

describe('visitingCard helpers', () => {
  it('normalizes Indian mobile numbers', () => {
    expect(normalizeIndianMobile('+91 98765 43210')).toBe('9876543210')
    expect(normalizeIndianMobile('09876543210')).toBe('9876543210')
    expect(normalizeIndianMobile('9876543210')).toBe('9876543210')
  })

  it('merges hospital into address without duplicating', () => {
    expect(composeDoctorAddress('City Hospital', 'Alandi Road')).toBe('City Hospital, Alandi Road')
    expect(composeDoctorAddress('City Hospital', 'City Hospital, Alandi')).toBe('City Hospital, Alandi')
    expect(composeDoctorAddress('', 'Alandi Road')).toBe('Alandi Road')
  })

  it('reads entry source and card images from payload', () => {
    expect(entrySourceFromPayload({ entry_source: 'camera' })).toBe('camera')
    expect(entrySourceFromPayload({ entry_source: 'other' })).toBe('manual')
    expect(
      cardImagesFromPayload({
        card_images: [{ url: 'https://res.cloudinary.com/x/front.jpg', side: 'front' }],
      }),
    ).toEqual([{ url: 'https://res.cloudinary.com/x/front.jpg', public_id: null, side: 'front' }])
  })
})
