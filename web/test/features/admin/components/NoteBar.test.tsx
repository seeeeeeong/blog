import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { AdminPostSummary } from '@/features/admin/api/types'
import { NoteBar } from '@/features/admin/components/NoteBar'

const POST: AdminPostSummary = {
  id: '0199-p',
  slug: 'tcp',
  title: 'TCP',
  status: 'DRAFT',
  topic: { slug: 'network', title: '네트워크', position: 2 },
  sectionId: '0199-s',
  number: '2.1',
  updatedAt: '2026-10-29T00:00:00Z',
  publishedAt: null,
}

type Props = Partial<Parameters<typeof NoteBar>[0]>

const render = (props: Props) =>
  renderToStaticMarkup(
    <NoteBar
      hasNote
      streaming={false}
      post={null}
      writingPost={false}
      onGenerate={() => {}}
      onWritePost={() => {}}
      {...props}
    />,
  )

describe('NoteBar', () => {
  it('regenerates a note and writes the section its post', () => {
    const out = render({})

    expect(out).toContain('<span class="mono ebar__save" aria-live="polite">Private</span>')
    expect(out).toMatch(/<button class="dock__item" type="button">.*Regenerate<\/button>/)
    expect(out).toContain(
      '<button class="dock__item dock__item--accent" type="button">Write post</button>',
    )
  })

  it('leaves Regenerate out before there is a note', () => {
    expect(render({ hasNote: false })).not.toContain('Regenerate')
  })

  it('holds Regenerate back while the model writes', () => {
    const out = render({ streaming: true })

    expect(out).toContain('aria-live="polite">Writing…</span>')
    expect(out).toMatch(/disabled="">.*Regenerate/)
  })

  it('opens the post the section already has', () => {
    expect(render({ post: POST })).toContain(
      '<a class="dock__item dock__item--accent" href="/admin/posts/0199-p">Open post</a>',
    )
  })

  it('holds Write post back while the post is being made', () => {
    expect(render({ writingPost: true })).toContain('disabled="">Write post</button>')
  })
})
