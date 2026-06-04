// Patches react-native-cloud-storage v3 for upstream crash (kuatsu/react-native-cloud-storage#59).
// On iOS with the New Architecture, NSUbiquityIdentityDidChangeNotification can fire while the
// codegen event-emitter callback (a std::function) is unbound. emitCloudAvailabilityChanged then
// invokes the empty std::function -> std::bad_function_call -> SIGABRT (app crash on foreground
// shortly after first iCloud use). We do not subscribe to this availability event at all, so we
// wrap the emit in a C++ try/catch (the file is Objective-C++) to make it crash-safe.
const fs = require('fs')
const path = require('path')

const mm = path.join(
  __dirname,
  '../node_modules/react-native-cloud-storage/ios/RCTCloudStorageCloudKit.mm',
)

if (!fs.existsSync(mm)) {
  console.log('[patch-cloud-storage] file not found, skipping:', mm)
  process.exit(0)
}

let src = fs.readFileSync(mm, 'utf8')

if (src.includes('upstream #59')) {
  console.log('[patch-cloud-storage] already patched')
  process.exit(0)
}

const target = '  [self emitOnCloudAvailabilityChanged:@{ @"available" : @(isCloudAvailable) }];'
const replacement = [
  '  try {',
  '    [self emitOnCloudAvailabilityChanged:@{ @"available" : @(isCloudAvailable) }];',
  '  } catch (...) {',
  '    // react-native-cloud-storage upstream #59: event-emitter std::function may be unbound',
  '    // when NSUbiquityIdentityDidChangeNotification fires -> swallow to avoid SIGABRT',
  '  }',
].join('\n')

if (!src.includes(target)) {
  console.warn(
    '[patch-cloud-storage] WARNING: target not found; library may have changed. Crash #59 NOT patched.',
  )
  process.exit(0)
}

src = src.replace(target, replacement)
fs.writeFileSync(mm, src)
console.log('[patch-cloud-storage] patched emitCloudAvailabilityChanged (issue #59)')
