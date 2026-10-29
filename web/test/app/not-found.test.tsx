import type { ReactElement } from 'react'
import { describe, expect, it } from 'vitest'
import { Missing } from '@/app/_components/Missing'
import { SiteChrome } from '@/app/_components/SiteChrome'
import NotFound from '@/app/not-found'

type Wrapped = ReactElement<{ children: ReactElement }>

describe('NotFound', () => {
  it('wraps the missing page in the reader dock and footer', () => {
    const page = NotFound() as Wrapped

    expect(page.type).toBe(SiteChrome)
    expect(page.props.children.type).toBe(Missing)
  })
})
