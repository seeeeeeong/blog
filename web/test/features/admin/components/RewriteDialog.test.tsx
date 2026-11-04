import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { RewriteDialog } from '@/features/admin/components/RewriteDialog'

describe('RewriteDialog', () => {
  it('shows the selected passage and asks what to change', () => {
    const out = renderToStaticMarkup(
      <RewriteDialog
        postId="0199-a"
        body="앞 고칠 문단 뒤"
        range={{ start: 2, end: 7 }}
        onApply={() => {}}
        onClose={() => {}}
      />,
    )

    expect(out).toContain('<pre class="mdx mstream">고칠 문단</pre>')
    expect(out).toContain('aria-label="요청"')
    expect(out).toContain('Generate')
    expect(out).not.toContain('Apply')
  })
})
