export type Brand = { brand: string }

/** The browser's name, as far as its user agent tells; Chrome reports itself only through its brands. */
export function browserName(userAgent: string, brands: readonly Brand[] = []): string {
  if (/Edg\//.test(userAgent)) return 'Edge'
  if (/Firefox\//.test(userAgent)) return 'Firefox'
  if (/Chrome\//.test(userAgent)) {
    return brands.some((b) => b.brand === 'Google Chrome') ? 'Chrome' : 'Chromium'
  }
  if (/Safari\//.test(userAgent)) return 'Safari'
  return 'Unknown'
}
