'use client'

import {
  type FormEvent,
  type ReactNode,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import { judge, type Verdict } from '@/features/posts/utils/answer'

type Props = {
  /** The accepted answers; the first is the one the solution names. */
  answers: string[]
  question: ReactNode
  explanation: ReactNode
}

type Feedback = Exclude<Verdict, 'empty'>

const FEEDBACK: Record<Feedback, string> = {
  right: '정답입니다.',
  wrong: '틀렸습니다. 다시 풀어 보세요.',
  'needs-number': '숫자로 답해 주세요.',
}

const subscribe = () => () => {}

/**
 * The reader's side of a quiz. Answering waits for the page to hydrate, since a form sent before
 * it would reload the page; the solution is a plain `<details>` and opens without script.
 */
export function QuizForm({ answers, question, explanation }: Props) {
  const id = useId()
  const field = useRef<HTMLInputElement>(null)
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [open, setOpen] = useState(false)
  const solved = feedback === 'right'

  const check = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const verdict = judge(field.current?.value ?? '', answers)
    if (verdict === 'empty') return
    setFeedback(verdict)
    if (verdict === 'right') setOpen(true)
    else field.current?.focus()
  }

  const retype = () => {
    if (feedback !== null && !solved) setFeedback(null)
  }

  return (
    <section className="quiz" aria-labelledby={`${id}-title`}>
      <div className="quiz__title" id={`${id}-title`}>
        도전 문제
      </div>
      {question}
      {answers.length > 0 && (
        <>
          <form className="quiz__form" onSubmit={check}>
            <label htmlFor={`${id}-answer`}>답</label>
            <input
              ref={field}
              id={`${id}-answer`}
              name="answer"
              maxLength={100}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              aria-describedby={`${id}-feedback`}
              aria-invalid={feedback === 'wrong' || feedback === 'needs-number'}
              readOnly={solved}
              disabled={!hydrated}
              onChange={retype}
            />
            <button type="submit" disabled={!hydrated || solved}>
              확인
            </button>
          </form>
          <p
            className={feedback ? `quiz__feedback quiz__feedback--${feedback}` : 'quiz__feedback'}
            id={`${id}-feedback`}
            role="status"
          >
            {feedback && FEEDBACK[feedback]}
          </p>
        </>
      )}
      {(answers.length > 0 || explanation) && (
        <details
          className="quiz__solution"
          open={open}
          onToggle={(event) => setOpen(event.currentTarget.open)}
        >
          <summary>{answers.length > 0 ? '정답 보기' : '풀이 보기'}</summary>
          {answers[0] && <p>정답: {answers[0]}</p>}
          {explanation}
        </details>
      )}
    </section>
  )
}
