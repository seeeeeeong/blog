import { describe, expect, it } from 'vitest'
import { Missing } from '@/app/_components/Missing'
import SiteNotFound from '@/app/(site)/not-found'

describe('SiteNotFound', () => {
  it('leaves the dock and footer to the site layout', () => {
    expect(SiteNotFound().type).toBe(Missing)
  })
})
