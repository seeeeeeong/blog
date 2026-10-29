import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import BookRoute, { generateMetadata } from '@/app/(site)/books/[id]/page'
import type { Book } from '@/features/books/api/types'

const BOOK: Book = {
  id: '0199-book',
  title: '컴퓨터 네트워킹: 하향식 접근',
  authors: 'Kurose, Ross',
  publisher: '퍼스트북',
  publishedOn: '2022-03-02',
  sourceUrl: 'https://www.yes24.com/product/goods/108512345',
  coverUrl: null,
  topic: null,
  writtenSections: 0,
  totalSections: 0,
  chapters: [],
}

const props = (id: string): PageProps<'/books/[id]'> => ({
  params: Promise.resolve({ id }),
  searchParams: Promise.resolve({}),
})

afterEach(() => vi.unstubAllGlobals())

describe('BookRoute', () => {
  it('renders the book', async () => {
    vi.stubGlobal('fetch', async () => Response.json(BOOK))

    const out = renderToStaticMarkup(await BookRoute(props('0199-book')))

    expect(out).toContain('<h1>컴퓨터 네트워킹: 하향식 접근</h1>')
  })

  it('titles the page after the book, and leaves it open to search', async () => {
    vi.stubGlobal('fetch', async () => Response.json(BOOK))

    await expect(generateMetadata(props('0199-book'))).resolves.toEqual({
      title: '컴퓨터 네트워킹: 하향식 접근',
      description: 'Kurose, Ross / 퍼스트북 / 2022',
    })
  })

  it('is not found when the api has no such book', async () => {
    vi.stubGlobal('fetch', async () => Response.json({ code: 'book.not_found' }, { status: 404 }))

    await expect(BookRoute(props('gone'))).rejects.toMatchObject({
      digest: expect.stringContaining('404'),
    })
  })
})
