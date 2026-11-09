import type { JsxProperties, JsxPropertyDescriptor, MdastJsx } from '@mdxeditor/editor'
import type { BlockContent, PhrasingContent } from 'mdast'
import type { MdxJsxAttribute } from 'mdast-util-mdx-jsx'

/** A component a post may hold, as the block editor knows it: the names the reader registers. */
export type BlockSpec = {
  name: string
  kind: 'flow' | 'text'
  children: boolean
  props: JsxPropertyDescriptor[]
}

const text = (name: string): JsxPropertyDescriptor => ({ name, type: 'string' })

export const BLOCK_SPECS: readonly BlockSpec[] = [
  { name: 'Callout', kind: 'flow', children: true, props: [text('label')] },
  { name: 'WidgetIdea', kind: 'flow', children: false, props: [text('note')] },
  { name: 'HandshakeWidget', kind: 'flow', children: false, props: [] },
  { name: 'HashTableFigure', kind: 'flow', children: false, props: [text('part')] },
  { name: 'Mark', kind: 'text', children: true, props: [] },
  { name: 'Tone', kind: 'text', children: true, props: [text('color')] },
  { name: 'Seek', kind: 'text', children: true, props: [{ name: 'to', type: 'expression' }] },
  { name: 'ScenarioLink', kind: 'text', children: true, props: [text('to')] },
]

export type SlashKey =
  | 'callout'
  | 'idea'
  | 'widget'
  | 'hash'
  | 'h2'
  | 'ol'
  | 'ul'
  | 'table'
  | 'code'

export type SlashItem = {
  key: SlashKey
  label: string
  hint: string
  group: 'component' | 'basic'
  /** Other words it is found by, Korean and English. */
  aliases: string
  shortcut?: string
}

export const SLASH_ITEMS: readonly SlashItem[] = [
  {
    key: 'callout',
    label: 'Callout',
    hint: '핵심을 따로 세웁니다',
    group: 'component',
    aliases: 'callout 핵심 콜아웃',
  },
  {
    key: 'idea',
    label: '그림 아이디어',
    hint: '나중에 그릴 그림의 메모',
    group: 'component',
    aliases: 'widgetidea 그림 위젯 아이디어',
  },
  {
    key: 'widget',
    label: 'HandshakeWidget',
    hint: 'TCP 연결 애니메이션',
    group: 'component',
    aliases: 'handshake tcp 위젯 핸드셰이크',
  },
  {
    key: 'hash',
    label: 'HashTableFigure',
    hint: '해시 테이블 그림',
    group: 'component',
    aliases: 'hashtable hashmap 해시 체이닝 탐사 적재율',
  },
  {
    key: 'h2',
    label: '섹션 제목',
    hint: '글의 한 섹션',
    group: 'basic',
    aliases: 'heading h2 제목 섹션',
    shortcut: '##',
  },
  {
    key: 'ol',
    label: '번호 목록',
    hint: '~해 봅시다 단계',
    group: 'basic',
    aliases: 'ordered list 번호 단계',
    shortcut: '1.',
  },
  {
    key: 'ul',
    label: '목록',
    hint: '점 목록',
    group: 'basic',
    aliases: 'bullet list 목록',
    shortcut: '-',
  },
  { key: 'table', label: '표', hint: '머리글 행이 있는 표', group: 'basic', aliases: 'table 표' },
  {
    key: 'code',
    label: '코드 블록',
    hint: '언어와 파일 이름',
    group: 'basic',
    aliases: 'code 코드',
    shortcut: '```',
  },
]

// Inside a block such as a Callout, a section or another component would break the post's shape.
const INSIDE_A_BLOCK: ReadonlySet<SlashKey> = new Set(['ol', 'ul', 'code'])

/** The items whose name, hint or other words hold the query, ignoring case and spaces. */
export function slashItems(query: string | null, insideBlock = false): SlashItem[] {
  const q = (query ?? '').replace(/\s+/g, '').toLowerCase()
  return SLASH_ITEMS.filter(
    (item) =>
      (!insideBlock || INSIDE_A_BLOCK.has(item.key)) &&
      `${item.label} ${item.hint} ${item.aliases}`.replace(/\s+/g, '').toLowerCase().includes(q),
  )
}

type Template = { name: string; props: JsxProperties; children: MdastJsx['children'] }

// An empty paragraph does not survive the import, so each starts with words to write over.
const paragraph = (value: string) => ({
  type: 'paragraph' as const,
  children: [{ type: 'text' as const, value }],
})

/** What each component starts as when the slash menu puts it in. */
export const TEMPLATES: Record<'callout' | 'idea' | 'widget' | 'hash', Template> = {
  callout: { name: 'Callout', props: { label: '핵심' }, children: [paragraph('핵심')] },
  idea: { name: 'WidgetIdea', props: { note: '' }, children: [] },
  widget: { name: 'HandshakeWidget', props: {}, children: [] },
  hash: { name: 'HashTableFigure', props: { part: 'chaining' }, children: [] },
}

/** A plain attribute's value; an expression or a missing one reads as undefined. */
export function attributeOf(node: MdastJsx, name: string): string | undefined {
  const found = node.attributes.find(
    (attribute): attribute is MdxJsxAttribute =>
      attribute.type === 'mdxJsxAttribute' && attribute.name === name,
  )
  return typeof found?.value === 'string' ? found.value : undefined
}

/** The attributes with one set to [value], every other one kept as it was and where it was. */
export function withAttribute(node: MdastJsx, name: string, value: string): MdastJsx['attributes'] {
  const next: MdxJsxAttribute = { type: 'mdxJsxAttribute', name, value }
  const at = node.attributes.findIndex(
    (attribute) => attribute.type === 'mdxJsxAttribute' && attribute.name === name,
  )
  if (at < 0) return [...node.attributes, next]
  return node.attributes.map((attribute, index) => (index === at ? next : attribute))
}

/** The tag as it reads in the MDX, its content shortened to `…`. */
export function tagSource(node: MdastJsx): string {
  const attributes = node.attributes.map((attribute) => {
    if (attribute.type === 'mdxJsxExpressionAttribute') return `{${attribute.value}}`
    const { name, value } = attribute
    if (value == null) return name
    return typeof value === 'string' ? `${name}="${value}"` : `${name}={${value.value}}`
  })
  const open = `<${[node.name ?? '', ...attributes].join(' ')}`
  return node.children.length > 0 ? `${open}>…</${node.name ?? ''}>` : `${open} />`
}

const BLOCKS = new Set([
  'paragraph',
  'heading',
  'list',
  'blockquote',
  'code',
  'table',
  'thematicBreak',
  'html',
  'mdxJsxFlowElement',
])

/**
 * A block's children as blocks: words written on the tag's own line, as in
 * `<Callout>한 줄</Callout>`, come as bare text, which a block's editor cannot hold outside a paragraph.
 */
export function asBlocks(children: MdastJsx['children']): BlockContent[] {
  const blocks: BlockContent[] = []
  let words: PhrasingContent[] = []
  const flush = () => {
    if (words.length > 0) blocks.push({ type: 'paragraph', children: words })
    words = []
  }
  for (const child of children as (BlockContent | PhrasingContent)[]) {
    if (BLOCKS.has(child.type)) {
      flush()
      blocks.push(child as BlockContent)
    } else {
      words.push(child as PhrasingContent)
    }
  }
  flush()
  return blocks
}

/** The colors `<Tone>` takes, as the reader's Tone draws them. */
export const TONES = [
  { color: 'orange', label: '주황' },
  { color: 'teal', label: '청록' },
  { color: 'blue', label: '파랑' },
  { color: 'pink', label: '분홍' },
] as const

/** A link the reader may follow: https, http, mail, or a path or anchor on this site. */
export const isLinkable = (url: string) => /^(https?:\/\/\S+|mailto:\S+|\/\S*|#\S+)$/.test(url)

const ORDERED = /^(\d+)[.)]\s/
const ITEM = /^\s*(\d+[.)]|[-*+])\s/
const FENCE = /^\s*(```|~~~)/

/**
 * The 1-based lines where an ordered list starts at a number other than 1. MDXEditor 4.3.3 reads
 * such a list as starting at 1 and saves it so (fixed in 4.4.0, mdx-editor/editor#471).
 */
export function listsStartingPastOne(mdx: string): number[] {
  const found: number[] = []
  let fenced = false
  let previous = ''
  mdx.split('\n').forEach((line, index) => {
    if (FENCE.test(line)) {
      fenced = !fenced
      previous = line
      return
    }
    if (fenced || line.trim() === '') return
    const number = line.match(ORDERED)?.[1]
    if (number !== undefined && Number(number) !== 1 && !ITEM.test(previous)) found.push(index + 1)
    previous = line
  })
  return found
}
