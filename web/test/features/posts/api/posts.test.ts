import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { loadPost, loadPosts, parsePost } from '@/features/posts/api/posts'

function file(fields: Record<string, string>, body = '본문') {
  const lines = Object.entries(fields).map(([key, value]) => `${key}: ${value}`)
  return ['---', ...lines, '---', body].join('\n')
}

const FIELDS = { title: '제목', description: '설명', date: '2026-11-11T21:00:00+09:00' }

describe('parsePost', () => {
  it('reads the frontmatter, keeps the body and dates it in UTC', () => {
    expect(parsePost('program-flow', file(FIELDS))).toEqual({
      slug: 'program-flow',
      title: '제목',
      description: '설명',
      date: '2026-11-11T12:00:00.000Z',
      body: '본문',
      draft: false,
    })
  })

  it('marks a draft', () => {
    expect(parsePost('a', file({ ...FIELDS, draft: 'true' })).draft).toBe(true)
  })

  it.each(['title', 'description', 'date'])('refuses a post without its %s', (key) => {
    const fields: Record<string, string> = { ...FIELDS }
    delete fields[key]

    expect(() => parsePost('a', file(fields))).toThrow(`a.mdx has no ${key} in its frontmatter`)
  })

  it('refuses a date that does not parse', () => {
    expect(() => parsePost('a', file({ ...FIELDS, date: 'yesterday' }))).toThrow(
      'a.mdx has a date that does not parse',
    )
  })
})

describe('loadPosts', () => {
  let dir: string

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'posts-'))
  })

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it('lists the posts newest first, leaving out drafts and other files', async () => {
    await writeFile(path.join(dir, 'old.mdx'), file({ ...FIELDS, date: '2026-01-01' }))
    await writeFile(path.join(dir, 'new.mdx'), file({ ...FIELDS, date: '2026-11-01' }))
    await writeFile(path.join(dir, 'wip.mdx'), file({ ...FIELDS, draft: 'true' }))
    await writeFile(path.join(dir, 'notes.md'), file(FIELDS))

    expect((await loadPosts(dir)).map((post) => post.slug)).toEqual(['new', 'old'])
  })

  it('is empty when the folder does not exist', async () => {
    await expect(loadPosts(path.join(dir, 'missing'))).resolves.toEqual([])
  })

  it('finds a post by slug, but never a draft', async () => {
    await mkdir(dir, { recursive: true })
    await writeFile(path.join(dir, 'a.mdx'), file(FIELDS))
    await writeFile(path.join(dir, 'wip.mdx'), file({ ...FIELDS, draft: 'true' }))

    expect((await loadPost('a', dir))?.title).toBe('제목')
    await expect(loadPost('wip', dir)).resolves.toBeNull()
    await expect(loadPost('none', dir)).resolves.toBeNull()
  })
})
