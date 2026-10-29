import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadBook, loadBooks } from '@/features/books/api/books'

const SUMMARY = {
  id: '0199-book',
  title: '컴퓨터 네트워킹: 하향식 접근',
  authors: 'Kurose, Ross',
  publisher: '퍼스트북',
  sourceUrl: 'https://www.yes24.com/product/goods/108512345',
  coverUrl: null,
  topic: null,
  writtenSections: 1,
  totalSections: 3,
}

afterEach(() => vi.unstubAllGlobals())

describe('loadBooks', () => {
  it('reads the books', async () => {
    const fetch = vi.fn(async (_url: string) => Response.json([SUMMARY]))
    vi.stubGlobal('fetch', fetch)

    await expect(loadBooks()).resolves.toEqual([SUMMARY])
    expect(fetch.mock.calls[0]?.[0]).toMatch(/\/api\/books$/)
  })

  it('answers nothing when the api is down, so the page still opens', async () => {
    vi.stubGlobal('fetch', async () => {
      throw new TypeError('fetch failed')
    })

    await expect(loadBooks()).resolves.toBeNull()
  })
})

describe('loadBook', () => {
  it('reads one book by its id', async () => {
    const book = { ...SUMMARY, publishedOn: null, chapters: [] }
    const fetch = vi.fn(async (_url: string) => Response.json(book))
    vi.stubGlobal('fetch', fetch)

    await expect(loadBook('0199-book')).resolves.toEqual(book)
    expect(fetch.mock.calls[0]?.[0]).toMatch(/\/api\/books\/0199-book$/)
  })

  it('answers nothing for an unknown book or an id that is no UUID', async () => {
    vi.stubGlobal('fetch', async () => new Response(null, { status: 404 }))
    await expect(loadBook('gone')).resolves.toBeNull()

    vi.stubGlobal('fetch', async () => new Response(null, { status: 400 }))
    await expect(loadBook('not-a-uuid')).resolves.toBeNull()
  })

  it('fails when the api fails', async () => {
    vi.stubGlobal('fetch', async () => new Response(null, { status: 500 }))

    await expect(loadBook('0199-book')).rejects.toThrow('answered 500')
  })
})
