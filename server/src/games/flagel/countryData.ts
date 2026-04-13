import rawCountries from 'world-countries'

export type Country = {
  code: string
  alpha3Code?: string
  name: string
  officialName?: string
  flagEmoji: string
  flagImageUrl?: string
  capital: string
  continent: string
  subregion?: string
  latitude: number
  longitude: number
  aliases?: string[]
}

const EXTRA_PLAYABLE_COUNTRY_CODES = new Set(['PS', 'TW', 'XK'])

export const COUNTRIES: Country[] = rawCountries
  .filter((country) => {
    if (!country.cca2 || country.latlng.length < 2) {
      return false
    }

    return country.unMember || EXTRA_PLAYABLE_COUNTRY_CODES.has(country.cca2)
  })
  .map((country) => {
    const code = country.cca2.toUpperCase()
    const aliases = Array.from(
      new Set(
        [
          country.name.common,
          country.name.official,
          ...country.altSpellings,
          ...Object.values(country.translations ?? {}).flatMap((translation) => [
            translation.common,
            translation.official,
          ]),
          ...Object.values(country.name.native ?? {}).flatMap((translation) => [
            translation.common,
            translation.official,
          ]),
        ]
          .filter((value): value is string => Boolean(value))
          .map((value) => value.trim())
          .filter(Boolean)
      )
    ).filter((value) => value !== country.name.common)

    return {
      code,
      alpha3Code: country.cca3.toUpperCase(),
      name: country.name.common,
      officialName: country.name.official,
      flagEmoji: country.flag,
      flagImageUrl: `/api/flags/${code.toLowerCase()}`,
      capital: country.capital?.[0] ?? 'Unknown',
      continent: country.region || 'Other',
      subregion: country.subregion || country.region || 'Other',
      latitude: country.latlng[0] ?? 0,
      longitude: country.latlng[1] ?? 0,
      aliases,
    }
  })
  .sort((left, right) => left.name.localeCompare(right.name))

export function pickRandomCountry(usedCodes: Set<string>) {
  const available = COUNTRIES.filter((country) => !usedCodes.has(country.code))

  if (available.length === 0) {
    usedCodes.clear()
    return pickRandomCountry(usedCodes)
  }

  const country = available[Math.floor(Math.random() * available.length)]
  usedCodes.add(country.code)
  return country
}

export function findCountryByGuess(guess: string) {
  const normalizedGuess = normalizeCountryGuess(guess)

  if (!normalizedGuess) {
    return null
  }

  const exactMatch =
    COUNTRIES.find((country) =>
      getCountrySearchCandidates(country).some(
        (candidate) => normalizeCountryGuess(candidate) === normalizedGuess
      )
    ) ?? null

  if (exactMatch) {
    return exactMatch
  }

  if (normalizedGuess.length < 3) {
    return null
  }

  const fuzzyMatches = COUNTRIES.filter((country) =>
    getCountrySearchCandidates(country).some((candidate) => {
      const normalizedCandidate = normalizeCountryGuess(candidate)

      return (
        normalizedCandidate.startsWith(normalizedGuess) ||
        normalizedCandidate.includes(` ${normalizedGuess}`) ||
        normalizedGuess.startsWith(normalizedCandidate)
      )
    })
  )

  return fuzzyMatches.length === 1 ? fuzzyMatches[0] : null
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

function getCountrySearchCandidates(country: Country) {
  return [
    country.name,
    country.officialName,
    country.code,
    country.alpha3Code,
    ...(country.aliases ?? []),
  ].filter((value): value is string => Boolean(value))
}

function normalizeCountryGuess(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180
}
