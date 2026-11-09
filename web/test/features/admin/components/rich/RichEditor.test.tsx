// @vitest-environment jsdom
import type { MDXEditorMethods } from '@mdxeditor/editor'
import { act, createElement, createRef } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { POST_COMPONENTS } from '@/app/_components/registry'
import { RichEditor } from '@/features/admin/components/rich/RichEditor'
import { PostBody } from '@/features/posts/components/PostBody'
import { compileMdx } from '@/features/posts/utils/mdx'

const POST = `브라우저가 연결하면 패킷 세 개가 먼저 오갑니다. 왜 세 번일까요?

## 세 번 주고받는 이유

**3-way 핸드셰이크(three-way handshake)**는 확인하는 과정입니다. 클라이언트가 <Tone color="orange">**SYN**</Tone>으로 알리고 *다음*을 기다립니다.

<HandshakeWidget />

1. <Seek to={0.35}>SYN이 도착하는 순간</Seek>으로 옮겨 봅시다.
2. <ScenarioLink to="loss">SYN을 잃는 경우</ScenarioLink>를 재생해 봅시다.

## SYN이 사라지면

보낸 쪽은 \`ss\`로 볼 수 있고, [문서](https://man7.org/linux/man-pages/man8/ss.8.html)에 옵션이 있습니다.

\`\`\`bash title="check.sh"
ss -tan state syn-sent
\`\`\`

| 잃어버린 패킷 | 다시 보내는 쪽 |
|---|---|
| SYN | 클라이언트 |

<WidgetIdea note="잃어버릴 패킷을 고른다" />

- 하나
- 둘

## 마무리

<Callout label="핵심">
세 번째 패킷이 있어야 <Mark>확인할 수 있습니다</Mark>.
</Callout>

<Diagram src="/a.png" />
`

const roots: Root[] = []

beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
})

afterEach(() => {
  for (const root of roots.splice(0)) act(() => root.unmount())
  document.body.replaceChildren()
})

async function open(markdown: string) {
  const ref = createRef<MDXEditorMethods>()
  const onChange = vi.fn()
  const onUnreadable = vi.fn()
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  roots.push(root)
  await act(async () => {
    root.render(createElement(RichEditor, { markdown, onChange, onUnreadable, ref }))
  })
  return { ref, host, onChange, onUnreadable }
}

const markdownOf = (ref: { current: MDXEditorMethods | null }) => ref.current?.getMarkdown() ?? ''

async function html(source: string) {
  const Content = await compileMdx(source, Object.keys(POST_COMPONENTS))
  return renderToStaticMarkup(createElement(PostBody, { Content, components: POST_COMPONENTS }))
}

describe('RichEditor', () => {
  it('opens each component as its block, and a tag it does not know as written', async () => {
    const { host } = await open(POST)

    expect(host.querySelector<HTMLInputElement>('.rcallout__label')?.value).toBe('핵심')
    expect(host.querySelector<HTMLTextAreaElement>('.ridea__note')?.value).toBe(
      '잃어버릴 패킷을 고른다',
    )
    expect(host.querySelector('.rwidget__name')?.textContent).toBe('HandshakeWidget')
    expect(host.querySelector('.rraw__source')?.textContent).toBe('<Diagram src="/a.png" />')
    expect(host.querySelector('.tone--orange')?.textContent).toBe('SYN')
    expect(host.querySelector<HTMLInputElement>('.rcode__meta')?.value).toBe('title="check.sh"')
  })

  it('reports no change for opening a post', async () => {
    const { onChange, onUnreadable } = await open(POST)

    expect(onChange).not.toHaveBeenCalled()
    expect(onUnreadable).not.toHaveBeenCalled()
  })

  it('writes MDX that renders as the post did, and writes it the same way again', async () => {
    const first = await open(POST)
    const written = markdownOf(first.ref)

    expect(await html(written)).toBe(await html(POST))
    expect(written).toContain('<Callout label="핵심">')
    expect(written).toContain('**3-way 핸드셰이크(three-way handshake)**는')
    expect(written).toContain('- 하나')

    const second = await open(written)
    expect(markdownOf(second.ref)).toBe(written)
  })

  it('opens a callout written on one line, its words in its text', async () => {
    const source = '<Callout label="핵심">프록시를 거쳐야 <Mark>적용</Mark>됩니다.</Callout>\n'
    const { host, ref, onUnreadable } = await open(source)

    expect(onUnreadable).not.toHaveBeenCalled()
    expect(host.querySelector('.rcallout .rnested')?.textContent).toBe(
      '프록시를 거쳐야 적용됩니다.',
    )
    expect(markdownOf(ref)).toContain('<Callout label="핵심">')
  })

  it('says so for MDX it cannot read, and leaves it as it was', async () => {
    const { onUnreadable, onChange } = await open('[링크][주소]\n\n[주소]: https://example.com\n')

    expect(onUnreadable).toHaveBeenCalledOnce()
    expect(onChange).not.toHaveBeenCalled()
  })
})
