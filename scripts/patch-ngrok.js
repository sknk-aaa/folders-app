// Patches @expo/ngrok to work with system ngrok v3 (snap).
// @expo/ngrok-bin bundles ngrok v2.3.41 which is rejected by free ngrok accounts
// (minimum agent version is now 3.20.0). This patch redirects to the system binary.
const fs = require('fs')
const path = require('path')

const ngrokBinIndex = path.join(__dirname, '../node_modules/@expo/ngrok-bin/index.js')
const ngrokIndex = path.join(__dirname, '../node_modules/@expo/ngrok/index.js')
const uuid = "const uuid = require('uuid');"

// 1. Point @expo/ngrok-bin to system ngrok v3
if (fs.existsSync(ngrokBinIndex)) {
  fs.writeFileSync(
    ngrokBinIndex,
    "// Patched: use system ngrok v3 (snap) which has valid authtoken\nmodule.exports = '/snap/bin/ngrok';\n"
  )
}

// 2. Fix race condition: ngrok v3 registers tunnels at cloud before local API is ready;
//    on "already exists" error, retry with a fresh UUID instead of the same one.
if (fs.existsSync(ngrokIndex)) {
  let src = fs.readFileSync(ngrokIndex, 'utf8')
  const target = "if (!isRetriable(err) || retryCount >= 100) {"
  const patch = [
    "// ngrok v3: on 'already exists', retry with fresh UUID",
    "if (err.body && err.body.details && err.body.details.err && err.body.details.err.includes('already exists')) {",
    "  if (retryCount < 5) {",
    "    opts.name = uuid.v4();",
    "    await new Promise((resolve) => setTimeout(resolve, 300));",
    "    return connectRetry(opts, ++retryCount);",
    "  }",
    "}",
    target,
  ].join('\n    ')

  if (!src.includes('already exists')) {
    src = src.replace(target, patch)
    fs.writeFileSync(ngrokIndex, src)
  }
}

console.log('✓ ngrok patches applied')
