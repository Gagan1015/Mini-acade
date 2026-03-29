export type Country = {
  code: string
  name: string
  flagEmoji: string
  capital: string
  continent: string
  latitude: number
  longitude: number
  aliases?: string[]
}

const COUNTRIES: Country[] = [
  {
    code: 'FR',
    name: 'France',
    flagEmoji: '🇫🇷',
    capital: 'Paris',
    continent: 'Europe',
    latitude: 46.2276,
    longitude: 2.2137,
    aliases: ['french republic'],
  },
  {
    code: 'DE',
    name: 'Germany',
    flagEmoji: '🇩🇪',
    capital: 'Berlin',
    continent: 'Europe',
    latitude: 51.1657,
    longitude: 10.4515,
  },
  {
    code: 'BR',
    name: 'Brazil',
    flagEmoji: '🇧🇷',
    capital: 'Brasilia',
    continent: 'South America',
    latitude: -14.235,
    longitude: -51.9253,
  },
  {
    code: 'AR',
    name: 'Argentina',
    flagEmoji: '🇦🇷',
    capital: 'Buenos Aires',
    continent: 'South America',
    latitude: -38.4161,
    longitude: -63.6167,
  },
  {
    code: 'US',
    name: 'United States',
    flagEmoji: '🇺🇸',
    capital: 'Washington, D.C.',
    continent: 'North America',
    latitude: 37.0902,
    longitude: -95.7129,
    aliases: ['usa', 'united states of america', 'america'],
  },
  {
    code: 'CA',
    name: 'Canada',
    flagEmoji: '🇨🇦',
    capital: 'Ottawa',
    continent: 'North America',
    latitude: 56.1304,
    longitude: -106.3468,
  },
  {
    code: 'MX',
    name: 'Mexico',
    flagEmoji: '🇲🇽',
    capital: 'Mexico City',
    continent: 'North America',
    latitude: 23.6345,
    longitude: -102.5528,
  },
  {
    code: 'NG',
    name: 'Nigeria',
    flagEmoji: '🇳🇬',
    capital: 'Abuja',
    continent: 'Africa',
    latitude: 9.082,
    longitude: 8.6753,
  },
  {
    code: 'ZA',
    name: 'South Africa',
    flagEmoji: '🇿🇦',
    capital: 'Pretoria',
    continent: 'Africa',
    latitude: -30.5595,
    longitude: 22.9375,
  },
  {
    code: 'EG',
    name: 'Egypt',
    flagEmoji: '🇪🇬',
    capital: 'Cairo',
    continent: 'Africa',
    latitude: 26.8206,
    longitude: 30.8025,
  },
  {
    code: 'IN',
    name: 'India',
    flagEmoji: '🇮🇳',
    capital: 'New Delhi',
    continent: 'Asia',
    latitude: 20.5937,
    longitude: 78.9629,
  },
  {
    code: 'JP',
    name: 'Japan',
    flagEmoji: '🇯🇵',
    capital: 'Tokyo',
    continent: 'Asia',
    latitude: 36.2048,
    longitude: 138.2529,
  },
  {
    code: 'KR',
    name: 'South Korea',
    flagEmoji: '🇰🇷',
    capital: 'Seoul',
    continent: 'Asia',
    latitude: 35.9078,
    longitude: 127.7669,
    aliases: ['korea', 'republic of korea'],
  },
  {
    code: 'AU',
    name: 'Australia',
    flagEmoji: '🇦🇺',
    capital: 'Canberra',
    continent: 'Oceania',
    latitude: -25.2744,
    longitude: 133.7751,
  },
  {
    code: 'NZ',
    name: 'New Zealand',
    flagEmoji: '🇳🇿',
    capital: 'Wellington',
    continent: 'Oceania',
    latitude: -40.9006,
    longitude: 174.886,
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    flagEmoji: '🇬🇧',
    capital: 'London',
    continent: 'Europe',
    latitude: 55.3781,
    longitude: -3.436,
    aliases: ['uk', 'great britain', 'britain'],
  },
]

export function pickRandomCountry(usedCodes: Set<string>) {
  const available = COUNTRIES.filter((country) => !usedCodes.has(country.code))

  if (available.length === 0) {
    usedCodes.clear()
    return pickRandomCountry(usedCodes)
  }

  const index = Math.floor(Math.random() * available.length)
  const country = available[index]
  usedCodes.add(country.code)
  return country
}

export function findCountryByGuess(guess: string) {
  const normalizedGuess = normalizeCountryName(guess)

  return (
    COUNTRIES.find((country) => {
      const aliases = country.aliases ?? []
      return [country.name, country.code, ...aliases].some(
        (candidate) => normalizeCountryName(candidate) === normalizedGuess
      )
    }) ?? null
  )
}

export function calculateDistanceKm(from: Country, to: Country) {
  const earthRadiusKm = 6371
  const dLat = degreesToRadians(to.latitude - from.latitude)
  const dLon = degreesToRadians(to.longitude - from.longitude)
  const startLat = degreesToRadians(from.latitude)
  const endLat = degreesToRadians(to.latitude)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(startLat) *
      Math.cos(endLat) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(earthRadiusKm * c)
}

export function getDirectionHint(from: Country, to: Country) {
  const vertical = to.latitude > from.latitude + 2 ? 'N' : to.latitude < from.latitude - 2 ? 'S' : ''
  const horizontal =
    to.longitude > from.longitude + 2 ? 'E' : to.longitude < from.longitude - 2 ? 'W' : ''

  return `${vertical}${horizontal}` || 'HERE'
}

function normalizeCountryName(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ')
}

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180
}

