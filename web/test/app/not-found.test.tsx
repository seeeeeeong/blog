import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import NotFound from '@/app/not-found'

describe('NotFound', () => {
  it('says the post is not there and leads back to the index', () => {
    const out = renderToStaticMarkup(<NotFound />)

    expect(out).toContain('<h1>찾는 글이 없습니다</h1>')
    expect(out).toContain('<a class="missing__home" href="/">목록으로</a>')
  })
})
