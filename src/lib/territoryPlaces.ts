export type TerritoryPlace = { territory: string; name: string; lat: number; lng: number }

const ALIASES: Record<string, string> = {
  phalan: 'phaltan',
  'rajguru nagar': 'rajgurunagar',
  'dehugaon': 'dehu',
  'dehuroad': 'dehu road',
}

function tokens(areaName: string): string[] {
  return areaName
    .replace(/\s*[-–]\s*[ivx]+$/i, '')
    .split('+')
    .map(part => part.trim().toLowerCase())
    .map(part => ALIASES[part] ?? part)
    .filter(part => part.length > 2)
}

/** Towns on the live map for the areas this MR actually works. */
export function placesForAreaNames(territories: string[], areaNames: string[]): TerritoryPlace[] {
  const known = new Set(TERRITORY_PLACES.map(place => place.territory.toLowerCase()))
  const wanted = territories.map(name => name.toLowerCase()).filter(name => known.has(name))
  const pool = wanted.length === 0
    ? TERRITORY_PLACES
    : TERRITORY_PLACES.filter(place => wanted.includes(place.territory.toLowerCase()))
  const found: TerritoryPlace[] = []
  const seen = new Set<string>()
  for (const area of areaNames) {
    for (const token of tokens(area)) {
      const place = pool.find(item => item.name.toLowerCase() === token)
        ?? (wanted.length === 0 ? undefined : TERRITORY_PLACES.find(item => item.name.toLowerCase() === token))
      if (!place) continue
      const key = `${place.territory}:${place.name}`
      if (seen.has(key)) continue
      seen.add(key)
      found.push(place)
    }
  }
  return found
}

export const TERRITORY_PLACES: TerritoryPlace[] = [
  {
    "territory": "PCMC",
    "name": "Alandi",
    "lat": 18.67724,
    "lng": 73.89811
  },
  {
    "territory": "PCMC",
    "name": "Aundh",
    "lat": 18.56188,
    "lng": 73.8102
  },
  {
    "territory": "PCMC",
    "name": "Baner",
    "lat": 18.55899,
    "lng": 73.78452
  },
  {
    "territory": "PCMC",
    "name": "Bhosari",
    "lat": 18.62101,
    "lng": 73.85013
  },
  {
    "territory": "PCMC",
    "name": "Chikhali",
    "lat": 18.66424,
    "lng": 73.82668
  },
  {
    "territory": "PCMC",
    "name": "Chinchwad",
    "lat": 18.64035,
    "lng": 73.79171
  },
  {
    "territory": "PCMC",
    "name": "Dehu",
    "lat": 18.72082,
    "lng": 73.76604
  },
  {
    "territory": "PCMC",
    "name": "Dehu Road",
    "lat": 18.68005,
    "lng": 73.73433
  },
  {
    "territory": "PCMC",
    "name": "Talegaon",
    "lat": 18.73511,
    "lng": 73.67209
  },
  {
    "territory": "PCMC",
    "name": "Dighi",
    "lat": 18.62271,
    "lng": 73.87388
  },
  {
    "territory": "PCMC",
    "name": "Bopkhel",
    "lat": 18.57759,
    "lng": 73.85332
  },
  {
    "territory": "PCMC",
    "name": "Hinjewadi",
    "lat": 18.59242,
    "lng": 73.76035
  },
  {
    "territory": "PCMC",
    "name": "Marunji",
    "lat": 18.61167,
    "lng": 73.71565
  },
  {
    "territory": "PCMC",
    "name": "Maan",
    "lat": 18.57462,
    "lng": 73.70925
  },
  {
    "territory": "PCMC",
    "name": "Kalewadi",
    "lat": 18.60697,
    "lng": 73.78354
  },
  {
    "territory": "PCMC",
    "name": "Khadki",
    "lat": 18.56818,
    "lng": 73.85078
  },
  {
    "territory": "PCMC",
    "name": "Dapodi",
    "lat": 18.58168,
    "lng": 73.83267
  },
  {
    "territory": "PCMC",
    "name": "Moshi",
    "lat": 18.65232,
    "lng": 73.8442
  },
  {
    "territory": "PCMC",
    "name": "Nigdi",
    "lat": 18.65981,
    "lng": 73.77728
  },
  {
    "territory": "PCMC",
    "name": "Akurdi",
    "lat": 18.64864,
    "lng": 73.76471
  },
  {
    "territory": "PCMC",
    "name": "Pimple Saudagar",
    "lat": 18.59816,
    "lng": 73.79777
  },
  {
    "territory": "PCMC",
    "name": "Pimple Nilakh",
    "lat": 18.56966,
    "lng": 73.79405
  },
  {
    "territory": "PCMC",
    "name": "Pimpri",
    "lat": 18.62319,
    "lng": 73.80199
  },
  {
    "territory": "PCMC",
    "name": "Sangvi",
    "lat": 18.579,
    "lng": 73.824
  },
  {
    "territory": "PCMC",
    "name": "Kasarwadi",
    "lat": 18.60809,
    "lng": 73.82087
  },
  {
    "territory": "PCMC",
    "name": "Thergaon",
    "lat": 18.60928,
    "lng": 73.77294
  },
  {
    "territory": "PCMC",
    "name": "Ravet",
    "lat": 18.64327,
    "lng": 73.74506
  },
  {
    "territory": "PCMC",
    "name": "Wakad",
    "lat": 18.60225,
    "lng": 73.76445
  },
  {
    "territory": "PCMC",
    "name": "Kamshet",
    "lat": 18.76694,
    "lng": 73.55243
  },
  {
    "territory": "PCMC",
    "name": "Somatane",
    "lat": 18.70345,
    "lng": 73.68058
  },
  {
    "territory": "Baramati",
    "name": "Baramati",
    "lat": 18.21985,
    "lng": 74.45341
  },
  {
    "territory": "Baramati",
    "name": "Bhigwan",
    "lat": 18.2977,
    "lng": 74.75498
  },
  {
    "territory": "Baramati",
    "name": "Daund",
    "lat": 18.48344,
    "lng": 74.36217
  },
  {
    "territory": "Baramati",
    "name": "Indapur",
    "lat": 18.11253,
    "lng": 74.92387
  },
  {
    "territory": "Baramati",
    "name": "Kurkumbh",
    "lat": 18.44939,
    "lng": 74.65478
  },
  {
    "territory": "Baramati",
    "name": "Morgaon",
    "lat": 18.27714,
    "lng": 74.31675
  },
  {
    "territory": "Baramati",
    "name": "Supa",
    "lat": 18.33769,
    "lng": 74.38003
  },
  {
    "territory": "Baramati",
    "name": "Nira",
    "lat": 18.10025,
    "lng": 74.21368
  },
  {
    "territory": "Baramati",
    "name": "Phaltan",
    "lat": 18.09271,
    "lng": 74.51411
  },
  {
    "territory": "Baramati",
    "name": "Walchandnagar",
    "lat": 18.03482,
    "lng": 74.78743
  },
  {
    "territory": "Baramati",
    "name": "Lasurne",
    "lat": 18.08763,
    "lng": 74.76569
  },
  {
    "territory": "Baramati",
    "name": "Malegaon",
    "lat": 18.13319,
    "lng": 74.5106
  },
  {
    "territory": "Baramati",
    "name": "Dorlewadi",
    "lat": 18.09243,
    "lng": 74.61552
  },
  {
    "territory": "Baramati",
    "name": "Kambleshwar",
    "lat": 18.05772,
    "lng": 74.45377
  },
  {
    "territory": "Baramati",
    "name": "Korhale",
    "lat": 18.08714,
    "lng": 74.3715
  },
  {
    "territory": "Baramati",
    "name": "Pandare",
    "lat": 18.13937,
    "lng": 74.46216
  },
  {
    "territory": "Baramati",
    "name": "Loni Kalbhor",
    "lat": 18.48835,
    "lng": 74.02219
  },
  {
    "territory": "Narayangaon",
    "name": "Narayangaon",
    "lat": 19.12029,
    "lng": 73.97329
  },
  {
    "territory": "Narayangaon",
    "name": "Chakan",
    "lat": 18.76231,
    "lng": 73.86254
  },
  {
    "territory": "Narayangaon",
    "name": "Junnar",
    "lat": 19.20068,
    "lng": 73.97682
  },
  {
    "territory": "Narayangaon",
    "name": "Manchar",
    "lat": 19.00333,
    "lng": 73.94271
  },
  {
    "territory": "Narayangaon",
    "name": "Otur",
    "lat": 19.26336,
    "lng": 73.98054
  },
  {
    "territory": "Narayangaon",
    "name": "Rajgurunagar",
    "lat": 18.85554,
    "lng": 73.8864
  },
  {
    "territory": "Narayangaon",
    "name": "Ghodegaon",
    "lat": 19.0466,
    "lng": 73.83867
  },
  {
    "territory": "Chalisgaon",
    "name": "Chalisgaon",
    "lat": 20.50237,
    "lng": 74.96557
  },
  {
    "territory": "Chalisgaon",
    "name": "Bhadgaon",
    "lat": 20.66025,
    "lng": 75.13049
  },
  {
    "territory": "Chalisgaon",
    "name": "Pachora",
    "lat": 20.65626,
    "lng": 75.40111
  },
  {
    "territory": "Chalisgaon",
    "name": "Kajgaon",
    "lat": 20.5705,
    "lng": 75.14206
  }
]
