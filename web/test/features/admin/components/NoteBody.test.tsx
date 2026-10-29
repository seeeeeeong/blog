import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { StudyNote } from '@/features/admin/api/types'
import { NoteBody } from '@/features/admin/components/NoteBody'

const NOTE: StudyNote = {
  id: '0199-n',
  sectionId: '0199-s',
  bodyMdx: '## 왜 세 번인가\n\n<b>',
  model: 'deepseek-chat',
  inputTokens: 120,
  outputTokens: 2400,
  createdAt: '2026-10-29T00:00:00Z',
}

type Props = Partial<Parameters<typeof NoteBody>[0]>

const render = (props: Props) =>
  renderToStaticMarkup(
    <NoteBody note={null} streaming={null} rendered={null} onGenerate={() => {}} {...props} />,
  )

describe('NoteBody', () => {
  it('offers Generate before the section has a note', () => {
    const out = render({})

    expect(out).toMatch(
      /^<div class="nempty"><button class="pill pill--accent" type="button">.*Generate<\/button><\/div>$/,
    )
  })

  it('shows the raw text as the model writes it, over the note it replaces', () => {
    const out = render({ note: NOTE, streaming: '## 왜 <세>', rendered: <p>old</p> })

    expect(out).toBe('<pre class="mdx mstream" aria-busy="true">## 왜 &lt;세&gt;</pre>')
  })

  it('shows the source of a note until its render arrives', () => {
    expect(render({ note: NOTE })).toBe(
      '<pre class="mdx mstream">## 왜 세 번인가\n\n&lt;b&gt;</pre>',
    )
  })

  it('shows the rendered note once it has arrived', () => {
    const out = render({ note: NOTE, rendered: <h2>왜 세 번인가</h2> })

    expect(out).toBe('<div class="prose epreview"><h2>왜 세 번인가</h2></div>')
  })
})
