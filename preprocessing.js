class ShareExtensionPreprocessor {
  run(args) {
    function og(prop) {
      var meta =
        document.querySelector('meta[property="' + prop + '"]') ||
        document.querySelector('meta[name="' + prop + '"]')
      return meta ? meta.getAttribute('content') : null
    }

    var candidates = []
    var seen = {}
    function add(url, w, h) {
      if (!url) return
      try {
        url = new URL(url, window.location.href).href
      } catch (e) {
        return
      }
      if (url.indexOf('data:') === 0) return
      if (seen[url]) return
      seen[url] = true
      candidates.push({ url: url, area: (w || 0) * (h || 0) })
    }

    // OGP image (highest priority for default selection)
    var ogImage = og('og:image')
    if (ogImage) {
      try {
        ogImage = new URL(ogImage, window.location.href).href
      } catch (e) {
        ogImage = null
      }
    }

    // <img> tags
    var imgs = document.querySelectorAll('img')
    for (var i = 0; i < imgs.length; i++) {
      var im = imgs[i]
      var w = im.naturalWidth || im.width || 0
      var h = im.naturalHeight || im.height || 0
      if (w < 100 || h < 100) continue
      add(im.currentSrc || im.src, w, h)
    }

    // <video poster>
    var videos = document.querySelectorAll('video[poster]')
    for (var j = 0; j < videos.length; j++) {
      add(videos[j].getAttribute('poster'), 800, 450)
    }

    // Sort by area descending, limit to 12
    candidates.sort(function (a, b) {
      return b.area - a.area
    })
    candidates = candidates.slice(0, 12)

    // Ensure OGP is included (at top) if not already
    var candidateUrls = candidates.map(function (c) {
      return c.url
    })
    if (ogImage && candidateUrls.indexOf(ogImage) === -1) {
      candidateUrls.unshift(ogImage)
    }

    args.completionFunction({
      url: window.location.href,
      title: document.title || '',
      ogTitle: og('og:title'),
      ogImage: ogImage,
      candidates: candidateUrls.slice(0, 12),
    })
  }
}

var ExtensionPreprocessingJS = new ShareExtensionPreprocessor()
