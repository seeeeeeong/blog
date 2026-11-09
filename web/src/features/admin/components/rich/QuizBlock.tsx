'use client'

import { type JsxEditorProps, NestedLexicalEditor, useMdastNodeUpdater } from '@mdxeditor/editor'
import type { MdxJsxFlowElement } from 'mdast-util-mdx-jsx'
import { type KeyboardEvent, useState } from 'react'
import { Icon } from '@/features/admin/components/Icon'
import {
  attributeOf,
  joinAnswers,
  splitAnswers,
  withAttribute,
} from '@/features/admin/utils/blocks'

/** `<Quiz answers>`: the answers as chips, the first shown as the answer; the rest edits in place. */
export function QuizBlock({ mdastNode }: JsxEditorProps) {
  const update = useMdastNodeUpdater()
  const [typed, setTyped] = useState('')
  const answers = splitAnswers(attributeOf(mdastNode, 'answers'))

  const save = (next: string[]) =>
    update({ attributes: withAttribute(mdastNode, 'answers', joinAnswers(next)) })

  // `|` separates the answers, so one answer cannot hold it.
  const add = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter' || event.nativeEvent.isComposing) return
    event.preventDefault()
    const answer = typed.trim()
    if (!answer || answer.includes('|') || answers.includes(answer)) return
    save([...answers, answer])
    setTyped('')
  }

  return (
    <div className="rquiz">
      <div className="rquiz__head">
        <span className="rquiz__name">
          <Icon name="quiz" />
          도전 문제
        </span>
        <span className="rquiz__label">정답</span>
        {answers.map((answer, index) => (
          <span key={answer} className={index === 0 ? 'rchip rchip--main' : 'rchip'}>
            {answer}
            <button
              type="button"
              aria-label={`${answer} 지우기`}
              onClick={() => save(answers.filter((other) => other !== answer))}
            >
              <Icon name="x" />
            </button>
          </span>
        ))}
        <input
          className="rchip__input"
          aria-label="정답 추가"
          value={typed}
          maxLength={100}
          onChange={(event) => setTyped(event.target.value)}
          onKeyDown={add}
        />
      </div>
      <NestedLexicalEditor<MdxJsxFlowElement>
        block
        contentEditableProps={{ className: 'rnested' }}
        getContent={(node) => node.children}
        getUpdatedMdastNode={(node, children) => ({
          ...node,
          children: children as MdxJsxFlowElement['children'],
        })}
      />
    </div>
  )
}
