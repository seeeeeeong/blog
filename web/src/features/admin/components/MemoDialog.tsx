'use client'

import { type FormEvent, useState } from 'react'
import { draftFromMemo } from '@/features/admin/api/posts'
import type { PostDraft, PostGeneration } from '@/features/admin/api/types'
import { DraftCompare } from '@/features/admin/components/DraftCompare'
import { DraftReview } from '@/features/admin/components/DraftReview'
import { Generating } from '@/features/admin/components/Generating'
import { KeptDrafts } from '@/features/admin/components/KeptDrafts'
import { MemoQuestions } from '@/features/admin/components/MemoQuestions'
import { Modal } from '@/features/admin/components/Modal'
import { useChangeChoice } from '@/features/admin/hooks/useChangeChoice'
import { useEventStream } from '@/features/admin/hooks/useEventStream'
import { useGenerations } from '@/features/admin/hooks/useGenerations'
import { useQuestions } from '@/features/admin/hooks/useQuestions'
import { canDraft, MEMO_MAX, memoProblem, memoShown } from '@/features/admin/utils/memo'

type Props = {
  open: boolean
  postId: string
  /** The body as the editor holds it: what is polished unless the admin writes otherwise. */
  body: string
  onApply: (bodyMdx: string) => void
  onClose: () => void
}

/**
 * A rough memo or the body so far, polished by the model, then compared with the body and reviewed;
 * or a draft written before, opened again the same way. The model may first ask what the memo leaves
 * out, and the answers go with the memo.
 */
export function MemoDialog({ open, postId, body, onApply, onClose }: Props) {
  const [edited, setEdited] = useState<string | null>(null)
  const memo = edited ?? body
  const [base, setBase] = useState('')
  const generations = useGenerations(open, postId)
  const questions = useQuestions(postId)
  const [reopened, setReopened] = useState<PostDraft | null>(null)
  const stream = useEventStream<PostDraft>()
  const { state } = stream
  const { step, generating, draft, failure } = memoShown(state, reopened)
  const choice = useChangeChoice(base, draft?.bodyMdx ?? null)
  const stale = draft !== null && body !== base

  const reset = () => {
    choice.clear()
    setReopened(null)
    stream.cancel()
  }

  const reopen = (generation: PostGeneration) => {
    reset()
    setBase(body)
    setEdited(generation.memo)
    setReopened(generation.draft)
  }

  const apply = () => {
    const polished = choice.applied()
    reset()
    questions.clear()
    setEdited(null)
    onApply(polished)
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canDraft(memo)) return
    setBase(body)
    choice.clear()
    setReopened(null)
    const asked = questions.memoWithAnswers(memo)
    void stream.start((signal) => draftFromMemo(postId, asked, signal))
  }

  const close = () => {
    reset()
    questions.clear()
    onClose()
  }

  return (
    <Modal open={open} eyebrow="From memo" onClose={close} wide>
      <form className="aform" onSubmit={submit}>
        {step === 'memo' && (
          <MemoInput
            memo={memo}
            onEdit={setEdited}
            questions={questions}
            generations={generations}
            onReopen={reopen}
          />
        )}
        {generating && <Generating step={generating.step} label={generating.label} />}
        {draft && (
          <div className="mresult">
            <DraftCompare blocks={choice.blocks} taken={choice.taken} onToggle={choice.toggle} />
            <DraftReview draft={draft} />
          </div>
        )}
        <MemoNotice problem={memoProblem(memo, failure ?? questions.failure, stale)} />
        <MemoFoot
          onCancel={step === 'memo' ? close : reset}
          onAsk={step === 'memo' ? () => questions.ask(memo) : null}
          asking={questions.asking}
          onApply={draft ? apply : null}
          applicable={!stale && choice.taken.size > 0}
          generable={step !== 'streaming' && !questions.asking && canDraft(memo)}
        />
      </form>
    </Modal>
  )
}

type InputProps = {
  memo: string
  onEdit: (memo: string) => void
  questions: ReturnType<typeof useQuestions>
  generations: PostGeneration[]
  onReopen: (generation: PostGeneration) => void
}

function MemoInput({ memo, onEdit, questions, generations, onReopen }: InputProps) {
  return (
    <>
      <textarea
        className="mdx mmemo"
        aria-label="메모"
        spellCheck={false}
        maxLength={MEMO_MAX}
        value={memo}
        onChange={(event) => onEdit(event.target.value)}
      />
      <MemoQuestions
        questions={questions.questions}
        answers={questions.answers}
        onAnswer={questions.answer}
      />
      {questions.asked && questions.questions.length === 0 && (
        <p className="mquestions__none">더 물을 것이 없습니다.</p>
      )}
      <KeptDrafts generations={generations} onOpen={onReopen} />
    </>
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
  /** Null once past the memo, where there is nothing left to ask about. */
  onAsk: (() => void) | null
  asking: boolean
  /** Null until there is a draft to apply; Generate shows instead. */
  onApply: (() => void) | null
  applicable: boolean
  generable: boolean
}

function MemoFoot({ onCancel, onAsk, asking, onApply, applicable, generable }: FootProps) {
  return (
    <div className="modal__foot">
      <button className="pill" type="button" onClick={onCancel}>
        Cancel
      </button>
      {onAsk && (
        <button className="pill" type="button" disabled={asking || !generable} onClick={onAsk}>
          {asking ? 'Asking' : 'Questions'}
        </button>
      )}
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
