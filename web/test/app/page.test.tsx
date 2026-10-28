import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import Home from '@/app/page'

describe('Home', () => {
  it('names the blog', () => {
    expect(renderToStaticMarkup(<Home />)).toContain('<h1>Sinseong Lee</h1>')
  })
})
