export type OgpResult = {
  title: string
  imageUrl: string | null
  faviconUrl: string | null
}

export async function fetchOgp(url: string): Promise<OgpResult> {
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'ja,en;q=0.9',
    },
  })
  const html = await response.text()

  const ogTitle = extractMetaProperty(html, 'og:title')
  const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]
  const ogImage = extractMetaProperty(html, 'og:image')
  const faviconHref = html.match(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i)?.[1]
    ?? html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut )?icon["']/i)?.[1]

  const baseUrl = new URL(url)
  let faviconUrl: string | null = null
  if (faviconHref) {
    faviconUrl = faviconHref.startsWith('http') ? faviconHref : `${baseUrl.origin}${faviconHref}`
  }

  return {
    title: decodeHtmlEntities(ogTitle || titleTag || ''),
    imageUrl: ogImage ? resolveUrl(ogImage, baseUrl.origin) : null,
    faviconUrl: faviconUrl || `${baseUrl.origin}/favicon.ico`,
  }
}

function extractMetaProperty(html: string, property: string): string | null {
  // property="..." content="..." または content="..." property="..." の両順序に対応
  const pattern1 = new RegExp(
    `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`,
    'i',
  )
  const pattern2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`,
    'i',
  )
  return html.match(pattern1)?.[1] ?? html.match(pattern2)?.[1] ?? null
}

function resolveUrl(src: string, origin: string): string {
  if (src.startsWith('http')) return src
  if (src.startsWith('//')) return `https:${src}`
  return `${origin}${src.startsWith('/') ? '' : '/'}${src}`
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
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
