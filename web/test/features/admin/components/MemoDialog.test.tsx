import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { MemoDialog } from '@/features/admin/components/MemoDialog'

const render = () =>
  renderToStaticMarkup(
    <MemoDialog open={false} postId="0199-a" body="" onApply={() => {}} onClose={() => {}} />,
  )

describe('MemoDialog', () => {
  it('opens on the memo, up to the length the api accepts', () => {
    const out = render()

    expect(out).toContain('<p class="modal__eyebrow">From memo</p>')
    expect(out).toContain(
      '<textarea class="mdx mmemo" aria-label="메모" spellCheck="false" maxLength="20000"></textarea>',
    )
  })

  it('starts from the body so far, so a rough post is polished as it is', () => {
    const out = renderToStaticMarkup(
      <MemoDialog
        open={false}
        postId="0199-a"
        body="막 쓴 글"
        onApply={() => {}}
        onClose={() => {}}
      />,
    )

    expect(out).toContain('maxLength="20000">막 쓴 글</textarea>')
    expect(out).toContain('<button class="pill pill--accent" type="submit">Generate</button>')
  })

  it('holds Generate back until the memo has text', () => {
    expect(render()).toContain(
      '<button class="pill pill--accent" type="submit" disabled="">Generate</button>',
    )
  })

  it('offers to ask about the memo first, once it has text', () => {
    expect(render()).toContain('<button class="pill" type="button" disabled="">Questions</button>')
  })

  it('has no title of its own beside the From memo label', () => {
    const out = render()

    expect(out).toContain('<dialog class="modal modal--wide" aria-label="From memo">')
    expect(out).not.toContain('<h2')
  })

  it('neither streams nor offers to apply before anything is generated', () => {
    const out = render()

    expect(out).not.toContain('mstream')
    expect(out).not.toContain('Apply')
  })
})
