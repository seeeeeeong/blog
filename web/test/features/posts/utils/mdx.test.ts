import type { MDXComponents } from 'mdx/types'
import { createElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Explanation } from '@/features/posts/components/Explanation'
import { PostBody } from '@/features/posts/components/PostBody'
import { Quiz } from '@/features/posts/components/Quiz'
import { compileMdx } from '@/features/posts/utils/mdx'

const REGISTRY: MDXComponents = {
  Box: ({ label, size, children }: { label?: string; size?: number; children?: ReactNode }) =>
    createElement('section', { 'data-label': label, 'data-size': size }, children),
}

async function render(source: string, registry: MDXComponents = REGISTRY): Promise<string> {
  const Content = await compileMdx(source, Object.keys(registry))
  return renderToStaticMarkup(createElement(PostBody, { Content, components: registry }))
}

afterEach(() => vi.restoreAllMocks())

describe('compileMdx', () => {
  it('renders markdown: paragraphs, emphasis, lists and inline code', async () => {
    const out = await render('Hello *there* and `code`.\n\n- one\n- two\n\n1. first\n2. second')

    expect(out).toContain('<p>Hello <em>there</em> and <code>code</code>.</p>')
    expect(out).toContain('<ul>\n<li>one</li>\n<li>two</li>\n</ul>')
    expect(out).toContain('<ol>\n<li>first</li>')
  })

  it('bolds a term that ends in punctuation even with a Korean particle right after it', async () => {
    const out = await render('**가상 메모리(virtual memory)**는 **"인용"**을 씁니다.')

    expect(out).toContain(
      '<p><strong>가상 메모리(virtual memory)</strong>는 <strong>&quot;인용&quot;</strong>을 씁니다.</p>',
    )
  })

  it('gives each section heading an id and a link to itself', async () => {
    const out = await render('## 왜 세 번인가\n\ntext\n\n### Step `one`')

    expect(out).toContain(
      '<h2 id="왜-세-번인가" class="anchor">왜 세 번인가<a href="#왜-세-번인가"><span class="sr-only">이 섹션 링크</span><svg viewBox="0 0 16 8"',
    )
    expect(out).toContain('<h3 id="step-one" class="anchor">Step <code>one</code>')
  })

  it('renders a registered component with its literal attributes', async () => {
    const out = await render('<Box label="hi" size={3}>\nInside **bold**.\n</Box>')

    expect(out).toContain(
      '<section data-label="hi" data-size="3"><p>Inside <strong>bold</strong>.</p></section>',
    )
  })

  it('drops an element no one registered, with what is inside it', async () => {
    const out = await render('<script>alert(1)</script>\n\n<Widget />\n\nA <span>quiet</span> end.')

    expect(out).not.toContain('script')
    expect(out).not.toContain('alert')
    expect(out).not.toContain('Widget')
    expect(out).toContain('<p>A  end.</p>')
  })

  it('runs no import, export or expression', async () => {
    const out = await render(
      "import fs from 'node:fs'\nexport const leak = 1\n\n{globalThis.process.exit(1)}\n\nSum: {1 + 1}.",
    )

    expect(out).toBe('<p>Sum: .</p>')
  })

  it('keeps an expression attribute only when it is a number or a boolean', async () => {
    const out = await render('<Box label={globalThis.secret} size={0.95} {...props} />')

    expect(out).toBe('<section data-size="0.95"></section>')
  })

  it('keeps the text of a link with a script scheme, but not the link', async () => {
    const out = await render('[click](javascript:alert(1)) and [home](/posts/a)')

    expect(out).toBe('<p>click and <a href="/posts/a">home</a></p>')
  })

  it('opens a link to another site apart', async () => {
    const out = await render('[spec](https://www.rfc-editor.org/rfc/rfc9293)')

    expect(out).toContain('target="_blank" rel="noreferrer"')
  })

  it('frames a fenced block with its file name, its lines and a copy button', async () => {
    const out = await render('```kotlin title="Server.kt"\nval a = 1\n\nhandle(a)\n```')

    expect(out).toContain(
      '<div class="code"><div class="code__head"><span class="mono">Server.kt</span>',
    )
    expect(out).toContain('aria-label="코드 복사"')
    expect(out).toContain('<span class="line"><span class="tk-k">val</span>')
    expect(out).toContain('<span class="tk-n">1</span>')
    expect(out.match(/class="line"/g)).toHaveLength(3)
  })

  it('names a block without a title by its language, and leaves an unknown one plain', async () => {
    const out = await render('```brainfuck\n+[-]\n```')

    expect(out).toContain('<span class="mono">brainfuck</span>')
    expect(out).toContain('<span class="line">+[-]</span>')
  })

  it('renders a table in a frame of its own, its columns aligned', async () => {
    const out = await render('| 방식 | 지연 |\n|:--|:-:|\n| `UDP` | 1 |')

    expect(out).toContain('<div class="table"><table>')
    expect(out).toContain('<th style="text-align:center">지연</th>')
    expect(out).toContain('<td style="text-align:left"><code>UDP</code></td>')
  })

  it('takes no strikethrough from a range written with tildes', async () => {
    const out = await render('1~10 사이, 20~30 사이')

    expect(out).toBe('<p>1~10 사이, 20~30 사이</p>')
  })

  it('drops an element no one registered inside a table cell', async () => {
    const out = await render('| a |\n|---|\n| <script>alert(1)</script> |')

    expect(out).not.toContain('script')
    expect(out).not.toContain('alert')
  })

  it('splits a quiz into its question and its explanation', async () => {
    const out = await render(
      '<Quiz answers="10|열">\n`0b1010`은 십진수로 얼마일까요?\n\n<Explanation>\n8 + 2 = 10입니다.\n</Explanation>\n</Quiz>',
      { Quiz, Explanation },
    )

    expect(out).toContain(
      '도전 문제</div><p><code>0b1010</code>은 십진수로 얼마일까요?</p><form class="quiz__form">',
    )
    expect(out).toContain(
      '<summary>정답 보기</summary><p>정답: 10</p><p>8 + 2 = 10입니다.</p></details>',
    )
  })

  it('answers null for a body that does not parse, and the page says so', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(compileMdx('<Box', ['Box'])).resolves.toBeNull()
    await expect(render('<Box')).resolves.toBe('<p class="empty">본문을 표시하지 못했습니다.</p>')
  })
})
