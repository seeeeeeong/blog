'use client'

import { useState } from 'react'
import { askAboutMemo } from '@/features/admin/api/posts'
import type { PostQuestions } from '@/features/admin/api/types'
import { useEventStream } from '@/features/admin/hooks/useEventStream'
import { withAnswers } from '@/features/admin/utils/memo'

/** Questions about the memo the admin may answer before the draft, and the memo with those answers. */
export function useQuestions(postId: string) {
  const stream = useEventStream<PostQuestions>()
  const [answers, setAnswers] = useState<string[]>([])
  const { state } = stream
  const questions = state.state === 'done' ? state.result.questions : []

  const ask = (memo: string) => {
    setAnswers([])
    void stream.start((signal) => askAboutMemo(postId, memo, signal))
  }

  const answer = (index: number, value: string) =>
    setAnswers((current) => Object.assign([...current], { [index]: value }))

  const clear = () => {
    setAnswers([])
    stream.cancel()
  }

  return {
    asking: state.state === 'streaming',
    asked: state.state === 'done',
    failure: state.state === 'failed' ? state.message : null,
    questions,
    answers,
    ask,
    answer,
    clear,
    memoWithAnswers: (memo: string) => withAnswers(memo, questions, answers),
  }
}
