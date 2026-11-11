import { describe, expect, it } from 'vitest'
import { splitFrontmatter } from '@/features/posts/utils/frontmatter'

describe('splitFrontmatter', () => {
  it('reads each key and value, and keeps the rest as the body', () => {
    const source = '---\ntitle: 프로그램 실행 흐름\ndate: 2026-11-11\n---\n\n본문입니다.\n'

    expect(splitFrontmatter(source)).toEqual({
      data: { title: '프로그램 실행 흐름', date: '2026-11-11' },
      body: '\n본문입니다.\n',
    })
  })

  it('unquotes a quoted value and keeps a colon inside one', () => {
    const { data } = splitFrontmatter('---\ntitle: "TCP: 세 번"\nnote: \'a\'\n---\n')

    expect(data).toEqual({ title: 'TCP: 세 번', note: 'a' })
  })

  it('skips lines that are not key and value', () => {
    expect(splitFrontmatter('---\n\njust text\n: no key\nx: 1\n---\n').data).toEqual({ x: '1' })
  })

  it('takes a file without frontmatter as all body', () => {
    expect(splitFrontmatter('# 제목\n')).toEqual({ data: {}, body: '# 제목\n' })
  })

  it('reads Windows line endings', () => {
    expect(splitFrontmatter('---\r\ntitle: a\r\n---\r\nbody')).toEqual({
      data: { title: 'a' },
      body: 'body',
    })
  })
})
