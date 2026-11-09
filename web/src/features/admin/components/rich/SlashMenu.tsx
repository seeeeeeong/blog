'use client'

import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  useBasicTypeaheadTriggerMatch,
} from '@lexical/react/LexicalTypeaheadMenuPlugin'
import { $createHeadingNode } from '@lexical/rich-text'
import { $setBlocksType } from '@lexical/selection'
import { insertCodeBlock$, insertJsx$, insertTable$, usePublisher } from '@mdxeditor/editor'
import {
  $getNodeByKey,
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  type TextNode,
} from 'lexical'
import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '@/features/admin/components/Icon'
import { type SlashItem, type SlashKey, slashItems, TEMPLATES } from '@/features/admin/utils/blocks'

const ICONS: Record<SlashKey, Parameters<typeof Icon>[0]['name']> = {
  callout: 'callout',
  idea: 'idea',
  widget: 'widget',
  hash: 'widget',
  safepoint: 'widget',
  h2: 'heading',
  ol: 'olist',
  ul: 'list',
  table: 'table',
  code: 'code',
}

const GROUPS = { component: '블로그 컴포넌트', basic: '기본 블록' }

class SlashOption extends MenuOption {
  readonly item: SlashItem

  constructor(item: SlashItem) {
    super(item.key)
    this.item = item
  }
}

type ListProps = {
  options: SlashOption[]
  selected: number | null
  onPick: (option: SlashOption) => void
  onHover: (index: number) => void
}

function SlashList({ options, selected, onPick, onHover }: ListProps) {
  return (
    <div className="rslash" role="listbox" aria-label="블록 넣기">
      {options.map((option, index) => {
        const { item } = option
        const head = index === 0 || options[index - 1]?.item.group !== item.group
        return (
          <div key={item.key}>
            {head && <div className="rslash__group">{GROUPS[item.group]}</div>}
            <button
              ref={option.setRefElement}
              type="button"
              role="option"
              aria-selected={index === selected}
              className="rslash__item"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onPick(option)}
              onMouseEnter={() => onHover(index)}
            >
              <span className={`rslash__tile rslash__tile--${item.key}`}>
                <Icon name={ICONS[item.key]} />
              </span>
              <span className="rslash__text">
                <b>{item.label}</b>
                <small>{item.hint}</small>
              </span>
              {item.shortcut && <span className="rslash__key">{item.shortcut}</span>}
            </button>
          </div>
        )
      })}
    </div>
  )
}

/**
 * `/` at the start of a word opens the blocks to put in, filtered by what follows it; inside a
 * block, only what may sit in one.
 */
export function SlashMenu({ insideBlock = false }: { insideBlock?: boolean }) {
  const [editor] = useLexicalComposerContext()
  const [query, setQuery] = useState<string | null>(null)
  const insertJsx = usePublisher(insertJsx$)
  const insertTable = usePublisher(insertTable$)
  const insertCodeBlock = usePublisher(insertCodeBlock$)
  const trigger = useBasicTypeaheadTriggerMatch('/', { minLength: 0 })
  const options = useMemo(
    () => slashItems(query, insideBlock).map((item) => new SlashOption(item)),
    [query, insideBlock],
  )

  const run = (key: SlashKey) => {
    if (key === 'h2') {
      editor.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) $setBlocksType(selection, () => $createHeadingNode('h2'))
      })
    } else if (key === 'ol') {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
    } else if (key === 'ul') {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
    } else if (key === 'table') {
      insertTable({ rows: 3, columns: 2 })
    } else if (key === 'code') {
      insertCodeBlock({ language: 'kotlin', code: '', meta: '' })
    } else {
      const { name, props, children } = TEMPLATES[key]
      insertJsx({ kind: 'flow', name, props, children } as Parameters<typeof insertJsx>[0])
    }
  }

  // Lexical calls this inside its own update, so the typed query goes at once; a block put in
  // on its own line then takes that line's place rather than leaving it empty above.
  const pick = (option: SlashOption, typed: TextNode | null, close: () => void) => {
    const parent = typed?.getParent()
    typed?.remove()
    const line =
      $isParagraphNode(parent) && parent.getTextContentSize() === 0 ? parent.getKey() : null
    close()
    const { key } = option.item
    run(key)
    if (line === null || key === 'h2' || key === 'ol' || key === 'ul') return
    editor.update(() => {
      const empty = $getNodeByKey(line)
      if ($isParagraphNode(empty) && empty.getTextContentSize() === 0 && empty.getNextSibling()) {
        empty.remove()
      }
    })
  }

  return (
    <LexicalTypeaheadMenuPlugin<SlashOption>
      options={options}
      triggerFn={trigger}
      onQueryChange={setQuery}
      onSelectOption={pick}
      menuRenderFn={(anchor, { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }) =>
        anchor.current && options.length > 0
          ? createPortal(
              <SlashList
                options={options}
                selected={selectedIndex}
                onPick={selectOptionAndCleanUp}
                onHover={setHighlightedIndex}
              />,
              anchor.current,
            )
          : null
      }
    />
  )
}
