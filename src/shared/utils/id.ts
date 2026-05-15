type CryptoLike = {
  randomUUID?: () => string
  getRandomValues?: (array: Uint8Array) => Uint8Array
}

const UUID_TEMPLATE = '10000000-1000-4000-8000-100000000000'

export function createId(): string {
  const cryptoLike = globalThis.crypto as CryptoLike | undefined

  if (typeof cryptoLike?.randomUUID === 'function') {
    return cryptoLike.randomUUID()
  }

  if (typeof cryptoLike?.getRandomValues === 'function') {
    return UUID_TEMPLATE.replace(/[018]/g, (c) =>
      (
        Number(c) ^
        (cryptoLike.getRandomValues!(new Uint8Array(1))[0] & (15 >> (Number(c) / 4)))
      ).toString(16),
    )
  }

  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`
}
