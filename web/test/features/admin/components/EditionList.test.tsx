import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { BookEdition } from '@/features/admin/api/types'
import { EditionList } from '@/features/admin/components/EditionList'

function edition(sourceRef: string, patch: Partial<BookEdition> = {}): BookEdition {
  return {
    sourceRef,
    sourceUrl: `https://www.yes24.com/product/goods/${sourceRef}`,
    title: '컴퓨터 네트워킹: 하향식 접근',
    authors: 'Kurose, Ross',
    publisher: '퍼스트북',
    isbn13: '9791159773486',
    publishedOn: '2022-03-02',
    coverUrl: null,
    hasContents: true,
    imported: false,
    ...patch,
  }
}

const EDITIONS = [
  edition('1'),
  edition('2', { publishedOn: '2017-01-02', imported: true }),
  edition('3', { hasContents: false }),
]

const render = (picked: string | null = null) =>
  renderToStaticMarkup(<EditionList editions={EDITIONS} picked={picked} onPick={() => {}} />)

describe('EditionList', () => {
  it('shows each edition with its byline and a link to its YES24 page', () => {
    const out = render()

    expect(out).toContain('<span class="mono brow__by">Kurose, Ross / 퍼스트북 / 2022</span>')
    expect(out).toContain('<span class="mono brow__by">Kurose, Ross / 퍼스트북 / 2017</span>')
    expect(out).toContain(
      '<a class="mono mlink" href="https://www.yes24.com/product/goods/1" target="_blank" rel="noreferrer">YES24</a>',
    )
  })

  it('lets only an edition with contents, not yet here, be picked', () => {
    const out = render('1')

    expect(out).toContain('aria-pressed="true"><span class="brow__title">')
    expect(out.match(/disabled=""/g)).toHaveLength(2)
    expect(out).toContain('<span class="row__meta mono">Imported</span>')
    expect(out).toContain('<span class="row__meta mono">No contents</span>')
  })

  it('says so when the search found nothing', () => {
    const out = renderToStaticMarkup(<EditionList editions={[]} picked={null} onPick={() => {}} />)

    expect(out).toContain('검색 결과가 없습니다.')
  })
})
