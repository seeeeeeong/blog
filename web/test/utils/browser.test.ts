import { describe, expect, it } from 'vitest'
import { browserName } from '@/utils/browser'

const CHROME =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'

describe('browserName', () => {
  it('tells Chrome from other Chromium browsers by its brands', () => {
    expect(browserName(CHROME, [{ brand: 'Google Chrome' }])).toBe('Chrome')
    expect(browserName(CHROME, [{ brand: 'Chromium' }])).toBe('Chromium')
    expect(browserName(`${CHROME} Edg/141.0.0.0`)).toBe('Edge')
  })

  it('names Safari and Firefox', () => {
    expect(
      browserName(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15',
      ),
    ).toBe('Safari')
    expect(
      browserName('Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0'),
    ).toBe('Firefox')
  })

  it('admits what it cannot tell', () => {
    expect(browserName('curl/8.7.1')).toBe('Unknown')
  })
})
