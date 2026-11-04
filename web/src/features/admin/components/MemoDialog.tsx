'use client'

import { type FormEvent, useEffect, useRef, useState } from 'react'
import { draftFromMemo } from '@/features/admin/api/posts'
import type { PostDraft } from '@/features/admin/api/types'
import { DraftCompare } from '@/features/admin/components/DraftCompare'
import { DraftReview } from '@/features/admin/components/DraftReview'
import { Modal } from '@/features/admin/components/Modal'
import { useChangeChoice } from '@/features/admin/hooks/useChangeChoice'
import { useEventStream } from '@/features/admin/hooks/useEventStream'
import { canDraft, MEMO_MAX, memoStep, memoView } from '@/features/admin/utils/memo'

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
  const output = useRef<HTMLPreElement>(null)
  const { text, stage, draft, failure } = memoView(state)
  const choice = useChangeChoice(base, draft?.bodyMdx ?? null)
  const stale = draft !== null && body !== base

  useEffect(() => {
    const pre = output.current
    if (pre && text) pre.scrollTop = pre.scrollHeight
  }, [text])

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
    <Modal open={open} eyebrow="From memo" title="메모나 쓴 글 다듬기" onClose={close} wide>
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
        {step === 'streaming' && (
          <pre ref={output} className="mdx mstream" aria-busy>
            {text}
          </pre>
        )}
        {draft && (
          <>
            <DraftCompare blocks={choice.blocks} taken={choice.taken} onToggle={choice.toggle} />
            <DraftReview draft={draft} />
          </>
        )}
        <MemoNotice
          stage={stage}
          problem={stale ? '그사이 본문이 바뀌었습니다. 다시 만들어 주세요.' : failure}
        />
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

function MemoNotice({ stage, problem }: { stage: string | null; problem: string | null }) {
  return (
    <>
      {problem && (
        <p className="aerror" role="alert">
          {problem}
        </p>
      )}
      {stage && <p role="status">{stage}</p>}
    </>
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
      {onApply ? (
        <button
          className="pill pill--accent"
          type="button"
          disabled={!applicable}
          onClick={onApply}
        >
          Apply
        </button>
      ) : (
        <button className="pill pill--accent" type="submit" disabled={!generable}>
          Generate
        </button>
      )}
    </div>
  )
}
