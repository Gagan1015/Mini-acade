import rawCountries, { type Country as WorldCountry } from 'world-countries'

export type FlagelCountry = {
  code: string
  alpha3Code: string
  name: string
  officialName: string
  flagEmoji: string
  flagImageUrl: string
  capital: string
  continent: string
  subregion: string
  latitude: number
  longitude: number
  aliases: string[]
}

const EXTRA_PLAYABLE_COUNTRY_CODES = new Set(['PS', 'TW', 'XK'])
export const FLAGEL_MAX_DISTANCE_KM = 20015

export const FLAGEL_COUNTRIES: FlagelCountry[] = rawCountries
  .filter((country) => {
    if (!country.cca2 || country.latlng.length < 2) {
      return false
    }

    return country.unMember || EXTRA_PLAYABLE_COUNTRY_CODES.has(country.cca2)
  })
  .map((country) => normalizeCountry(country))
  .sort((left, right) => left.name.localeCompare(right.name))

export function pickRandomFlagelCountry(usedCodes: Set<string>) {
  const availableCountries = FLAGEL_COUNTRIES.filter((country) => !usedCodes.has(country.code))

  if (availableCountries.length === 0) {
    usedCodes.clear()
    return pickRandomFlagelCountry(usedCodes)
  }

  const country = availableCountries[Math.floor(Math.random() * availableCountries.length)]
  usedCodes.add(country.code)
  return country
}

export function getFlagAssetPath(code: string) {
  return `/api/flags/${code.trim().toLowerCase()}`
}

export function findFlagelCountryByGuess(guess: string) {
  const normalizedGuess = normalizeCountryGuess(guess)

  if (!normalizedGuess) {
    return null
  }

  const exactMatch =
    FLAGEL_COUNTRIES.find((country) =>
      [country.name, country.officialName, country.code, country.alpha3Code, ...country.aliases].some(
        (candidate) => normalizeCountryGuess(candidate) === normalizedGuess
      )
    ) ?? null

  if (exactMatch) {
    return exactMatch
  }

  if (normalizedGuess.length < 3) {
    return null
  }

  const fuzzyMatches = FLAGEL_COUNTRIES.filter((country) =>
    [country.name, country.officialName, ...country.aliases].some((candidate) => {
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

export function calculateCountryDistanceKm(from: FlagelCountry, to: FlagelCountry) {
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

export function getCountryDirectionHint(from: FlagelCountry, to: FlagelCountry) {
  const vertical = to.latitude > from.latitude + 2 ? 'N' : to.latitude < from.latitude - 2 ? 'S' : ''
  const horizontal =
    to.longitude > from.longitude + 2 ? 'E' : to.longitude < from.longitude - 2 ? 'W' : ''

  return `${vertical}${horizontal}` || 'HERE'
}

export function getFlagelAccuracyPercent(distanceKm: number) {
  const boundedDistance = Math.min(Math.max(distanceKm, 0), FLAGEL_MAX_DISTANCE_KM)
  return Math.round((1 - boundedDistance / FLAGEL_MAX_DISTANCE_KM) * 100)
}

export function normalizeCountryGuess(value: string) {
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

function normalizeCountry(country: WorldCountry): FlagelCountry {
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
    flagImageUrl: getFlagAssetPath(code),
    capital: country.capital?.[0] ?? 'Unknown',
    continent: country.region || 'Other',
    subregion: country.subregion || country.region || 'Other',
    latitude: country.latlng[0] ?? 0,
    longitude: country.latlng[1] ?? 0,
    aliases,
  }
}

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180
}
