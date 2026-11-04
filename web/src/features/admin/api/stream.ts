import {
  AdminApiError,
  CSRF_HEADER,
  csrfToken,
  errorOf,
  FALLBACK_MESSAGE,
} from '@/features/admin/api/client'
import { readFrames } from '@/features/admin/utils/sse'

/** A piece of the model's text as it writes, a later step starting, then the whole result once. */
export type StreamEvent<T> =
  | { type: 'text'; text: string }
  | { type: 'stage'; stage: string }
  | { type: 'done'; result: T }

function eventOf<T>(
  name: string,
  data: T & { text: string; stage: string },
): StreamEvent<T> | null {
  if (name === 'text') return { type: 'text', text: data.text }
  if (name === 'stage') return { type: 'stage', stage: data.stage }
  if (name === 'done') return { type: 'done', result: data }
  return null
}

/**
 * A write whose answer streams back as server-sent events. A refusal before the stream opens is
 * thrown as the api's error, as is an `error` event inside it; a stream that ends without `done`
 * was cut off.
 */
export async function* adminStream<T>(
  path: string,
  body: unknown,
  signal?: AbortSignal,
): AsyncGenerator<StreamEvent<T>> {
  const headers: Record<string, string> = {
    [CSRF_HEADER]: await csrfToken(),
    Accept: 'text/event-stream',
  }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const response = await fetch(path, {
    method: 'POST',
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: 'same-origin',
    cache: 'no-store',
    signal,
  })
  if (!response.ok || !response.body) throw await errorOf(response)
  for await (const frame of readFrames(response.body)) {
    const data = JSON.parse(frame.data)
    if (frame.event === 'error') throw new AdminApiError(response.status, data.code, data.message)
    const event = eventOf<T>(frame.event, data)
    if (event) yield event
    if (event?.type === 'done') return
  }
  throw new AdminApiError(response.status, 'common.stream_cut', FALLBACK_MESSAGE)
}
