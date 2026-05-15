// Patches @expo/ngrok to work with system ngrok v3 (snap).
// @expo/ngrok-bin bundles ngrok v2.3.41 which is rejected by free ngrok accounts
// (minimum agent version is now 3.20.0). This patch redirects to the system binary.
const fs = require('fs')
const path = require('path')

const ngrokBinIndex = path.join(__dirname, '../node_modules/@expo/ngrok-bin/index.js')
const ngrokIndex = path.join(__dirname, '../node_modules/@expo/ngrok/index.js')

// 1. Point @expo/ngrok-bin to system ngrok v3
if (fs.existsSync(ngrokBinIndex)) {
  fs.writeFileSync(
    ngrokBinIndex,
    "// Patched: use system ngrok v3 (snap) which has valid authtoken\nmodule.exports = '/snap/bin/ngrok';\n"
  )
}

// 2. Patch @expo/ngrok/index.js for ngrok v3 compatibility:
//    a) Strip fields not accepted by ngrok v3 tunnel API (authtoken, configPath, port, etc.)
//    b) On "already exists" error, retry with a fresh UUID instead of the same one.
if (fs.existsSync(ngrokIndex)) {
  let src = fs.readFileSync(ngrokIndex, 'utf8')

  if (!src.includes('NGROK_V3_TUNNEL_FIELDS')) {
    src = src.replace(
      'async function connectRetry(opts, retryCount = 0) {\n  opts.name = String(opts.name || uuid.v4());\n  try {\n    const response = await ngrokClient.startTunnel(opts);',
      `// Fields accepted by ngrok v3 tunnel creation API
const NGROK_V3_TUNNEL_FIELDS = new Set([
  'name', 'proto', 'addr', 'hostname', 'subdomain', 'host_header',
  'bind_tls', 'inspect', 'auth', 'schemes', 'metadata', 'ip_restriction',
  'circuit_breaker', 'compression', 'mutual_tls', 'oauth', 'oidc',
  'request_header', 'response_header', 'webhook_verification',
]);

async function connectRetry(opts, retryCount = 0) {
  opts.name = String(opts.name || uuid.v4());
  const tunnelOpts = Object.fromEntries(
    Object.entries(opts).filter(([k]) => NGROK_V3_TUNNEL_FIELDS.has(k))
  );
  tunnelOpts.name = opts.name;
  try {
    const response = await ngrokClient.startTunnel(tunnelOpts);`
    )
  }

  if (!src.includes('already exists')) {
    const target = "    if (!isRetriable(err) || retryCount >= 100) {"
    const patch = `    // ngrok v3: on 'already exists', retry with fresh UUID
    if (err.body && err.body.details && err.body.details.err && err.body.details.err.includes('already exists')) {
      if (retryCount < 5) {
        opts.name = uuid.v4();
        await new Promise((resolve) => setTimeout(resolve, 300));
        return connectRetry(opts, ++retryCount);
      }
    }
    ${target}`
    src = src.replace(target, patch)
  }

  fs.writeFileSync(ngrokIndex, src)
}

console.log('✓ ngrok patches applied')
