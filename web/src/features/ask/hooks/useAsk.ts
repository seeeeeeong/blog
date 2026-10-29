'use client'

import { useEffect, useReducer, useRef } from 'react'
import { askQuestion, messageOf } from '@/features/ask/api/ask'
import {
  converse,
  isAsking,
  postSlugOf,
  requestOf,
  startConversation,
} from '@/features/ask/utils/conversation'

/**
 * The conversation on the page at [path] and its answer in flight. Another page starts over and
 * lets the old answer go.
 */
export function useAsk(path: string) {
  const [conversation, dispatch] = useReducer(converse, path, startConversation)
  const flight = useRef<AbortController | null>(null)

  useEffect(() => {
    dispatch({ type: 'reset', path })
    return () => {
      flight.current?.abort()
      flight.current = null
    }
  }, [path])

  const asking = isAsking(conversation)

  const ask = async (text: string) => {
    const question = text.trim()
    if (!question || asking) return
    const request = requestOf(conversation, question, postSlugOf(path))
    const controller = new AbortController()
    flight.current = controller
    dispatch({ type: 'ask', question })
    try {
      await askQuestion(request, controller.signal, (event) => {
        if (!controller.signal.aborted) dispatch(event)
      })
    } catch (error) {
      if (!controller.signal.aborted) dispatch({ type: 'fail', message: messageOf(error) })
    } finally {
      if (flight.current === controller) flight.current = null
    }
  }

  const stop = () => {
    flight.current?.abort()
    flight.current = null
    dispatch({ type: 'stop' })
  }

  return { exchanges: conversation.exchanges, asking, ask, stop }
}
