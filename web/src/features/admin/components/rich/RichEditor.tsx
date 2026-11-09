'use client'

import '@mdxeditor/editor/style.css'
import '@/features/admin/components/rich/rich.css'
import {
  type CodeBlockEditorDescriptor,
  codeBlockPlugin,
  headingsPlugin,
  type JsxComponentDescriptor,
  type JsxEditorProps,
  jsxPlugin,
  linkPlugin,
  listsPlugin,
  MDXEditor,
  type MDXEditorMethods,
  markdownShortcutPlugin,
  quotePlugin,
  type ToMarkdownOptions,
  tablePlugin,
  thematicBreakPlugin,
} from '@mdxeditor/editor'
import type { ComponentType, Ref } from 'react'
import { blockMenuPlugin } from '@/features/admin/components/rich/blockMenu'
import { CalloutBlock } from '@/features/admin/components/rich/CalloutBlock'
import { CodeBlockCard } from '@/features/admin/components/rich/CodeBlockCard'
import { ExplanationBlock } from '@/features/admin/components/rich/ExplanationBlock'
import { IdeaBlock } from '@/features/admin/components/rich/IdeaBlock'
import { InlineBlock } from '@/features/admin/components/rich/InlineBlock'
import { QuizBlock } from '@/features/admin/components/rich/QuizBlock'
import { RawBlock } from '@/features/admin/components/rich/RawBlock'
import { WidgetBlock } from '@/features/admin/components/rich/WidgetBlock'
import { BLOCK_SPECS } from '@/features/admin/utils/blocks'

const EDITORS: Record<string, ComponentType<JsxEditorProps>> = {
  Callout: CalloutBlock,
  Explanation: ExplanationBlock,
  HandshakeWidget: WidgetBlock,
  Mark: InlineBlock,
  Quiz: QuizBlock,
  ScenarioLink: InlineBlock,
  Seek: InlineBlock,
  Tone: InlineBlock,
  WidgetIdea: IdeaBlock,
}

const DESCRIPTORS: JsxComponentDescriptor[] = [
  ...BLOCK_SPECS.map((spec) => ({
    name: spec.name,
    kind: spec.kind,
    hasChildren: spec.children,
    props: spec.props,
    Editor: EDITORS[spec.name] ?? RawBlock,
  })),
  { name: '*', kind: 'flow', hasChildren: true, props: [], Editor: RawBlock },
]

const CODE: CodeBlockEditorDescriptor = { match: () => true, priority: 0, Editor: CodeBlockCard }

// `_` emphasis fails next to Hangul, so the writer escapes it; `*` does not.
const TO_MARKDOWN: ToMarkdownOptions = {
  bullet: '-',
  bulletOther: '*',
  emphasis: '*',
  strong: '*',
  rule: '-',
  fence: '`',
  fences: true,
  listItemIndent: 'one',
  incrementListMarker: true,
  setext: false,
  closeAtx: false,
}

const PLUGINS = [
  headingsPlugin({ allowedHeadingLevels: [2, 3] }),
  listsPlugin(),
  quotePlugin(),
  thematicBreakPlugin(),
  linkPlugin(),
  tablePlugin(),
  codeBlockPlugin({ codeBlockEditorDescriptors: [CODE] }),
  jsxPlugin({ jsxComponentDescriptors: DESCRIPTORS }),
  markdownShortcutPlugin(),
  blockMenuPlugin(),
]

type Props = {
  markdown: string
  /** The MDX after an edit; opening the post, which only normalizes it, does not count. */
  onChange: (markdown: string) => void
  /** The MDX holds something the editor cannot read; nothing was changed. */
  onUnreadable: (reason: string) => void
  ref?: Ref<MDXEditorMethods>
}

/** The post as blocks: `/` puts one in, the handle beside a block moves it. */
export function RichEditor({ markdown, onChange, onUnreadable, ref }: Props) {
  return (
    <div className="rich">
      <MDXEditor
        ref={ref}
        contentEditableClassName="prose rich__doc"
        markdown={markdown}
        plugins={PLUGINS}
        suppressHtmlProcessing
        toMarkdownOptions={TO_MARKDOWN}
        onChange={(next, initial) => {
          if (!initial) onChange(next)
        }}
        onError={({ error }) => onUnreadable(error)}
      />
    </div>
  )
}
