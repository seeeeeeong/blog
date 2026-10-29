'use client'

import { type FormEvent, type KeyboardEvent, type Ref, useState } from 'react'
import { AskIcon } from '@/features/ask/components/AskIcon'
import { MAX_QUESTION } from '@/features/ask/utils/conversation'

type Props = {
  asking: boolean
  inputRef?: Ref<HTMLTextAreaElement>
  onAsk: (question: string) => void
  onStop: () => void
}

/** The question box: Enter sends, Shift+Enter breaks the line, and an answer in flight can be stopped. */
export function AskForm({ asking, inputRef, onAsk, onStop }: Props) {
  const [question, setQuestion] = useState('')
  const empty = question.trim() === ''

  const send = () => {
    if (empty || asking) return
    onAsk(question)
    setQuestion('')
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    send()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // Safari ends a composition before its keydown, which then reads 229.
    const composing = event.nativeEvent.isComposing || event.keyCode === 229
    if (event.key !== 'Enter' || event.shiftKey || composing) return
    event.preventDefault()
    send()
  }

  return (
    <form className="ask__form" onSubmit={onSubmit}>
      <textarea
        ref={inputRef}
        rows={1}
        maxLength={MAX_QUESTION}
        aria-label="질문 입력"
        enterKeyHint="send"
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        onKeyDown={onKeyDown}
      />
      {asking ? (
        <button className="ask__send" type="button" aria-label="답변 멈추기" onClick={onStop}>
          <AskIcon name="stop" />
        </button>
      ) : (
        <button className="ask__send" type="submit" aria-label="질문 보내기" disabled={empty}>
          <AskIcon name="send" />
        </button>
      )}
    </form>
  )
}
