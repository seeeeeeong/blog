'use client'

import { type FormEvent, useState } from 'react'
import { rewriteSelection } from '@/features/admin/api/posts'
import type { PostRewrite } from '@/features/admin/api/types'
import { DraftCompare } from '@/features/admin/components/DraftCompare'
import { Modal } from '@/features/admin/components/Modal'
import { useChangeChoice } from '@/features/admin/hooks/useChangeChoice'
import { useEventStream } from '@/features/admin/hooks/useEventStream'
import { stageLabel } from '@/features/admin/utils/memo'
import { partsOf, replaced, type SelectionRange } from '@/features/admin/utils/selection'

type Props = {
  postId: string
  body: string
  /** The selection when the dialog opened; null keeps it closed. */
  range: SelectionRange | null
  onApply: (bodyMdx: string) => void
  onClose: () => void
}

/** One selected passage rewritten by the model, then compared with what it replaces. */
export function RewriteDialog({ postId, body, range, onApply, onClose }: Props) {
  const [instruction, setInstruction] = useState('')
  const stream = useEventStream<PostRewrite>()
  const { state } = stream
  const parts = partsOf(body, range)
  const result = state.state === 'done' ? state.result.replacement : null
  const choice = useChangeChoice(parts.selected, result)

  const finish = () => {
    choice.clear()
    stream.cancel()
    setInstruction('')
    onClose()
  }

  const apply = () => {
    if (range) onApply(replaced(body, range, choice.applied()))
    finish()
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    choice.clear()
    void stream.start((signal) => rewriteSelection(postId, { ...parts, instruction }, signal))
  }

  return (
    <Modal
      open={range !== null}
      eyebrow="Rewrite"
      title="선택한 부분 다시 쓰기"
      onClose={finish}
      wide
    >
      <form className="aform" onSubmit={submit}>
        {state.state === 'idle' || state.state === 'failed' ? (
          <>
            <pre className="mdx mstream">{parts.selected}</pre>
            <input
              className="ainput"
              aria-label="요청"
              placeholder="어떻게 고칠까요? 비워 두면 읽기 쉽게 다듬습니다"
              maxLength={500}
              value={instruction}
              onChange={(event) => setInstruction(event.target.value)}
            />
          </>
        ) : null}
        {state.state === 'streaming' && (
          <pre className="mdx mstream" aria-busy>
            {state.text}
          </pre>
        )}
        {state.state === 'streaming' && <p role="status">{stageLabel(state.stage)}</p>}
        {result !== null && (
          <DraftCompare blocks={choice.blocks} taken={choice.taken} onToggle={choice.toggle} />
        )}
        {state.state === 'failed' && (
          <p className="aerror" role="alert">
            {state.message}
          </p>
        )}
        <div className="modal__foot">
          <button className="pill" type="button" onClick={finish}>
            Cancel
          </button>
          {/* Separate elements: Apply resets the dialog, and a button turned into a submit one mid-click submits. */}
          {result !== null ? (
            <button
              key="apply"
              className="pill pill--accent"
              type="button"
              disabled={choice.taken.size === 0}
              onClick={apply}
            >
              Apply
            </button>
          ) : (
            <button
              key="generate"
              className="pill pill--accent"
              type="submit"
              disabled={state.state === 'streaming'}
            >
              Generate
            </button>
          )}
        </div>
      </form>
    </Modal>
  )
}
