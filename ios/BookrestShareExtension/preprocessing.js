class ShareExtensionPreprocessor {
  run(args) {
    function og(prop) {
      var meta =
        document.querySelector('meta[property="' + prop + '"]') ||
        document.querySelector('meta[name="' + prop + '"]')
      return meta ? meta.getAttribute('content') : null
    }
    args.completionFunction({
      url: window.location.href,
      title: document.title || '',
      ogTitle: og('og:title'),
      ogImage: og('og:image'),
      ogDescription: og('og:description'),
    })
  }
}

var ExtensionPreprocessingJS = new ShareExtensionPreprocessor()
