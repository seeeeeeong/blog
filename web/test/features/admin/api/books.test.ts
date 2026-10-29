import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getBook,
  getSectionNote,
  importBook,
  listBooks,
  placeBookInTopic,
  searchBooks,
  writeSectionNote,
  writeSectionPost,
} from '@/features/admin/api/books'
import { AdminApiError } from '@/features/admin/api/client'

let fetch: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.stubGlobal('document', { cookie: 'XSRF-TOKEN=t' })
  fetch = vi.fn(async () => Response.json({}))
  vi.stubGlobal('fetch', fetch)
})

afterEach(() => vi.unstubAllGlobals())

const sent = () => fetch.mock.calls.map(([path, init]) => [path, (init as RequestInit).method])

const bodyOf = (call: number) => JSON.parse(fetch.mock.calls[call]?.[1].body)

describe('admin books', () => {
  it('searches YES24 with the query encoded', async () => {
    await searchBooks('컴퓨터 네트워킹 & TCP')

    expect(sent()).toEqual([
      [`/api/admin/books/search?q=${encodeURIComponent('컴퓨터 네트워킹 & TCP')}`, 'GET'],
    ])
  })

  it('reads the books and one book by its id', async () => {
    await listBooks()
    await getBook('0199-book')

    expect(sent()).toEqual([
      ['/api/admin/books', 'GET'],
      ['/api/admin/books/0199-book', 'GET'],
    ])
  })

  it('imports an edition, with its topic when one is chosen', async () => {
    await importBook({ sourceRef: '108512345', topicSlug: 'network' })

    expect(sent()).toEqual([['/api/admin/books', 'POST']])
    expect(bodyOf(0)).toEqual({ sourceRef: '108512345', topicSlug: 'network' })
  })

  it('places a book in a topic, or takes it out with null', async () => {
    await placeBookInTopic('0199-book', 'network')
    await placeBookInTopic('0199-book', null)

    expect(sent()).toEqual([
      ['/api/admin/books/0199-book/topic', 'PUT'],
      ['/api/admin/books/0199-book/topic', 'PUT'],
    ])
    expect(bodyOf(0)).toEqual({ topicSlug: 'network' })
    expect(bodyOf(1)).toEqual({ topicSlug: null })
  })

  it("writes a section's post at the section's endpoint", async () => {
    await writeSectionPost('0199-s')

    expect(sent()).toEqual([['/api/admin/sections/0199-s/post', 'POST']])
  })

  it("reads a section's latest note, and null before one is written", async () => {
    fetch.mockResolvedValueOnce(Response.json({ id: '0199-n', bodyMdx: '## TCP' }))
    fetch.mockResolvedValueOnce(
      Response.json(
        { code: 'book.note_not_found', message: '아직 공부 노트가 없습니다' },
        { status: 404 },
      ),
    )

    await expect(getSectionNote('0199-s')).resolves.toEqual({ id: '0199-n', bodyMdx: '## TCP' })
    await expect(getSectionNote('0199-s')).resolves.toBeNull()
    expect(sent()).toEqual([
      ['/api/admin/sections/0199-s/note', 'GET'],
      ['/api/admin/sections/0199-s/note', 'GET'],
    ])
  })

  it('passes on any other failure to read a note', async () => {
    fetch.mockResolvedValueOnce(
      Response.json(
        { code: 'book.section_not_found', message: '목차를 찾을 수 없습니다' },
        { status: 404 },
      ),
    )

    await expect(getSectionNote('0199-s')).rejects.toMatchObject({
      code: 'book.section_not_found',
    })
  })

  it("streams a new note at the section's note endpoint", async () => {
    fetch.mockResolvedValueOnce(new Response('event: done\ndata: {"id":"0199-n"}\n\n'))

    const events = []
    for await (const event of writeSectionNote('0199-s')) events.push(event)

    expect(sent()).toEqual([['/api/admin/sections/0199-s/note', 'POST']])
    expect(events).toEqual([{ type: 'done', result: { id: '0199-n' } }])
  })

  it("passes on the api's message, as when YES24 has no key", async () => {
    fetch.mockResolvedValueOnce(
      Response.json(
        { code: 'book.source_unavailable', message: 'YES24 검색이 설정되지 않았습니다' },
        { status: 503 },
      ),
    )

    await expect(searchBooks('tcp')).rejects.toEqual(
      new AdminApiError(503, 'book.source_unavailable', 'YES24 검색이 설정되지 않았습니다'),
    )
  })
})
