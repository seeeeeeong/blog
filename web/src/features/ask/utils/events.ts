import type { AskEvent, AskSource } from '@/features/ask/api/types'
import type { SseFrame } from '@/features/ask/utils/sse'

/** An `error` frame: the stream failed after it opened, with the api's `{code, message}`. */
export type AskFailure = { type: 'error'; code: string; message: string }

type Json = Record<string, unknown>

function jsonOf(data: string): Json | undefined {
  try {
    const value: unknown = JSON.parse(data)
    return typeof value === 'object' && value !== null ? (value as Json) : undefined
  } catch {
    return undefined
  }
}

const isSource = (value: unknown): value is AskSource =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as Json).slug === 'string' &&
  typeof (value as Json).title === 'string'

/** What a frame of the answer's stream says, or nothing for a frame it does not know. */
export function askEventOf({ event, data }: SseFrame): AskEvent | AskFailure | undefined {
  const json = jsonOf(data)
  if (!json) return undefined
  switch (event) {
    case 'sources':
      return {
        type: 'sources',
        posts: Array.isArray(json.posts) ? json.posts.filter(isSource) : [],
      }
    case 'text':
      return typeof json.text === 'string' ? { type: 'text', text: json.text } : undefined
    case 'done':
      return {
        type: 'done',
        grounded: json.grounded === true,
        conversationId: String(json.conversationId ?? ''),
      }
    case 'error':
      return { type: 'error', code: String(json.code ?? ''), message: String(json.message ?? '') }
    default:
      return undefined
  }
}
