'use client'

import { type FormEvent, useEffect, useRef, useState } from 'react'
import { draftFromMemo } from '@/features/admin/api/posts'
import type { PostDraft } from '@/features/admin/api/types'
import { Modal } from '@/features/admin/components/Modal'
import { useEventStream } from '@/features/admin/hooks/useEventStream'
import { asksBeforeReplacing, canDraft, MEMO_MAX, memoStep } from '@/features/admin/utils/memo'

type Props = {
  open: boolean
  postId: string
  /** The body as the editor holds it, which the draft replaces. */
  body: string
  onApply: (draft: PostDraft) => void
  onClose: () => void
}

/** A draft of the body from a rough memo, streamed in as the model writes it. */
export function MemoDialog({ open, postId, body, onApply, onClose }: Props) {
  const [memo, setMemo] = useState('')
  const stream = useEventStream<PostDraft>()
  const { state } = stream
  const step = memoStep(state)
  const output = useRef<HTMLPreElement>(null)
  const text = state.state === 'streaming' || state.state === 'done' ? state.text : ''

  useEffect(() => {
    const pre = output.current
    if (pre && text) pre.scrollTop = pre.scrollHeight
  }, [text])

  const apply = (draft: PostDraft) => {
    stream.reset()
    setMemo('')
    onApply(draft)
  }

  const generate = async () => {
    const draft = await stream.start((signal) => draftFromMemo(postId, memo, signal))
    if (draft && !asksBeforeReplacing(body)) apply(draft)
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (canDraft(memo)) void generate()
  }

  const close = () => {
    stream.cancel()
    onClose()
  }

  return (
    <Modal open={open} eyebrow="From memo" title="메모로 초안 만들기" onClose={close} wide>
      <form className="aform" onSubmit={submit}>
        {step === 'memo' ? (
          <textarea
            className="mdx mmemo"
            aria-label="메모"
            spellCheck={false}
            maxLength={MEMO_MAX}
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
          />
        ) : (
          <pre ref={output} className="mdx mstream" aria-busy={step === 'streaming'}>
            {text}
          </pre>
        )}
        {state.state === 'failed' && (
          <p className="aerror" role="alert">
            {state.message}
          </p>
        )}
        {step === 'confirm' && <p>지금 본문을 이 초안으로 바꿉니다.</p>}
        <div className="modal__foot">
          <button className="pill" type="button" onClick={step === 'memo' ? close : stream.cancel}>
            Cancel
          </button>
          {state.state === 'done' ? (
            <button className="pill pill--accent" type="button" onClick={() => apply(state.result)}>
              Replace
            </button>
          ) : (
            <button
              className="pill pill--accent"
              type="submit"
              disabled={step === 'streaming' || !canDraft(memo)}
            >
              Generate
            </button>
          )}
        </div>
      </form>
    </Modal>
  )
}
