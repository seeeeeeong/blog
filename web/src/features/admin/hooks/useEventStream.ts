'use client'

import { useEffect, useReducer, useRef } from 'react'
import { messageOf } from '@/features/admin/api/client'
import type { StreamEvent } from '@/features/admin/api/stream'
import {
  IDLE,
  type StreamAction,
  type StreamState,
  streamReducer,
} from '@/features/admin/utils/stream'

type Open<T> = (signal: AbortSignal) => AsyncGenerator<StreamEvent<T>>

async function follow<T>(
  events: AsyncGenerator<StreamEvent<T>>,
  signal: AbortSignal,
  dispatch: (action: StreamAction<T>) => void,
): Promise<T | null> {
  for await (const event of events) {
    if (signal.aborted) return null
    if (event.type === 'done') {
      dispatch({ type: 'done', result: event.result })
      return event.result
    }
    dispatch({ type: 'text', text: event.text })
  }
  return null
}

/**
 * Runs one streamed write at a time and keeps its text as it arrives. Cancelling aborts the
 * request, and so does leaving the page.
 */
export function useEventStream<T>() {
  const [state, dispatch] = useReducer(streamReducer<T>, IDLE as StreamState<T>)
  const controller = useRef<AbortController | null>(null)

  useEffect(() => () => controller.current?.abort(), [])

  /** The result once `done` arrives; null when cancelled, or when it failed, as the state says. */
  const start = async (open: Open<T>): Promise<T | null> => {
    controller.current?.abort()
    const current = new AbortController()
    controller.current = current
    dispatch({ type: 'start' })
    try {
      return await follow(open(current.signal), current.signal, dispatch)
    } catch (error) {
      if (!current.signal.aborted) dispatch({ type: 'fail', message: messageOf(error) })
      return null
    } finally {
      if (controller.current === current) controller.current = null
    }
  }

  const cancel = () => {
    controller.current?.abort()
    controller.current = null
    dispatch({ type: 'reset' })
  }

  const reset = () => dispatch({ type: 'reset' })

  return { state, start, cancel, reset }
}
