export type OgpResult = {
  title: string
  imageUrl: string | null
  faviconUrl: string | null
}

export async function fetchOgp(url: string): Promise<OgpResult> {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BookmarkBot/1.0)' },
  })
  const html = await response.text()

  const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1]
  const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]
  const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1]
  const faviconHref = html.match(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i)?.[1]

  const baseUrl = new URL(url)
  let faviconUrl: string | null = null
  if (faviconHref) {
    faviconUrl = faviconHref.startsWith('http') ? faviconHref : `${baseUrl.origin}${faviconHref}`
  }

  return {
    title: ogTitle || titleTag || '',
    imageUrl: ogImage || null,
    faviconUrl: faviconUrl || `${baseUrl.origin}/favicon.ico`,
  }
}

export function openInBrowser(url: string, browser: 'safari' | 'chrome' | 'edge'): string {
  if (browser === 'chrome') {
    return url.replace(/^https?/, 'googlechrome')
  }
  if (browser === 'edge') {
    return url.replace(/^https/, 'microsoft-edge-https').replace(/^http:/, 'microsoft-edge-http:')
  }
  return url
}
