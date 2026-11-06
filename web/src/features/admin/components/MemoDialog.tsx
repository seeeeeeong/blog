'use client'

import { type FormEvent, useState } from 'react'
import { draftFromMemo } from '@/features/admin/api/posts'
import type { PostDraft } from '@/features/admin/api/types'
import { DraftCompare } from '@/features/admin/components/DraftCompare'
import { DraftReview } from '@/features/admin/components/DraftReview'
import { Generating } from '@/features/admin/components/Generating'
import { Modal } from '@/features/admin/components/Modal'
import { useChangeChoice } from '@/features/admin/hooks/useChangeChoice'
import { useEventStream } from '@/features/admin/hooks/useEventStream'
import { canDraft, MEMO_MAX, memoProblem, memoStep, memoView } from '@/features/admin/utils/memo'

type Props = {
  open: boolean
  postId: string
  /** The body as the editor holds it: what is polished unless the admin writes otherwise. */
  body: string
  onApply: (bodyMdx: string) => void
  onClose: () => void
}

/** A rough memo or the body so far, polished by the model, then compared with the body and reviewed. */
export function MemoDialog({ open, postId, body, onApply, onClose }: Props) {
  const [edited, setEdited] = useState<string | null>(null)
  const memo = edited ?? body
  const [base, setBase] = useState('')
  const stream = useEventStream<PostDraft>()
  const { state } = stream
  const step = memoStep(state)
  const { generating, draft, failure } = memoView(state)
  const choice = useChangeChoice(base, draft?.bodyMdx ?? null)
  const stale = draft !== null && body !== base

  const reset = () => {
    choice.clear()
    stream.cancel()
  }

  const apply = () => {
    const polished = choice.applied()
    reset()
    setEdited(null)
    onApply(polished)
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canDraft(memo)) return
    setBase(body)
    choice.clear()
    void stream.start((signal) => draftFromMemo(postId, memo, signal))
  }

  const close = () => {
    reset()
    onClose()
  }

  return (
    <Modal open={open} eyebrow="From memo" onClose={close} wide>
      <form className="aform" onSubmit={submit}>
        {step === 'memo' && (
          <textarea
            className="mdx mmemo"
            aria-label="메모"
            spellCheck={false}
            maxLength={MEMO_MAX}
            value={memo}
            onChange={(event) => setEdited(event.target.value)}
          />
        )}
        {generating && <Generating step={generating.step} label={generating.label} />}
        {draft && (
          <div className="mresult">
            <DraftCompare blocks={choice.blocks} taken={choice.taken} onToggle={choice.toggle} />
            <DraftReview draft={draft} />
          </div>
        )}
        <MemoNotice problem={memoProblem(memo, failure, stale)} />
        <MemoFoot
          onCancel={step === 'memo' ? close : reset}
          onApply={draft ? apply : null}
          applicable={!stale && choice.taken.size > 0}
          generable={step !== 'streaming' && canDraft(memo)}
        />
      </form>
    </Modal>
  )
}

function MemoNotice({ problem }: { problem: string | null }) {
  if (!problem) return null
  return (
    <p className="aerror" role="alert">
      {problem}
    </p>
  )
}

type FootProps = {
  onCancel: () => void
  /** Null until there is a draft to apply; Generate shows instead. */
  onApply: (() => void) | null
  applicable: boolean
  generable: boolean
}

function MemoFoot({ onCancel, onApply, applicable, generable }: FootProps) {
  return (
    <div className="modal__foot">
      <button className="pill" type="button" onClick={onCancel}>
        Cancel
      </button>
      {/* Keys keep these two elements apart: Apply resets the dialog, and were React to turn the same
          button into a submit one mid-click, the browser would submit the form and bill another run. */}
      {onApply ? (
        <button
          key="apply"
          className="pill pill--accent"
          type="button"
          disabled={!applicable}
          onClick={onApply}
        >
          Apply
        </button>
      ) : (
        <button key="generate" className="pill pill--accent" type="submit" disabled={!generable}>
          Generate
        </button>
      )}
    </div>
  )
}
