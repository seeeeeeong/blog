import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Missing } from '@/app/_components/Missing'

describe('Missing', () => {
  it('says the post is not there and leads back to the index', () => {
    const out = renderToStaticMarkup(<Missing />)

    expect(out).toContain('<h1>찾는 글이 없습니다</h1>')
    expect(out).toContain('<a class="missing__home" href="/">목록으로</a>')
  })
})
