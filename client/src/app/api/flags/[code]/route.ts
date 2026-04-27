import { NextResponse } from 'next/server'

const SVG_FLAG_BASE_URL = 'https://flagcdn.com'
const PNG_FLAG_BASE_URL = 'https://flagcdn.com/w640'

export const revalidate = 60 * 60 * 24 * 30

export async function GET(
  _request: Request,
  { params }: { params: { code: string } }
) {
  const code = params.code.trim().toLowerCase()

  if (!/^[a-z]{2}$/.test(code)) {
    console.warn('[flagel][flag-proxy] invalid code requested', { code: params.code })
    return NextResponse.json({ error: 'Invalid flag code.' }, { status: 400 })
  }

  const upstreamCandidates = [
    `${SVG_FLAG_BASE_URL}/${code}.svg`,
    `${PNG_FLAG_BASE_URL}/${code}.png`,
  ]

  for (const upstreamUrl of upstreamCandidates) {
    try {
      const response = await fetch(upstreamUrl, {
        headers: {
          Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'User-Agent': 'Arcado Flag Proxy',
        },
        next: { revalidate },
      })

      if (!response.ok) {
        console.warn('[flagel][flag-proxy] upstream responded with non-ok status', {
          code,
          upstreamUrl,
          status: response.status,
        })
        continue
      }

      const contentType = response.headers.get('content-type') ?? 'image/svg+xml'
      const cacheControl = response.headers.get('cache-control') ?? `public, max-age=${revalidate}`

      return new Response(response.body, {
        status: 200,
        headers: {
          'Cache-Control': cacheControl,
          'Content-Type': contentType,
        },
      })
    } catch (error) {
      console.warn('[flagel][flag-proxy] upstream fetch failed', {
        code,
        upstreamUrl,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  console.error('[flagel][flag-proxy] unable to load flag asset', { code })
  return NextResponse.json({ error: 'Unable to load flag asset.' }, { status: 502 })
}
