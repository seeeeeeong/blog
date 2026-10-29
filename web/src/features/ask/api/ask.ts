import type { AskEvent, AskRequest } from '@/features/ask/api/types'
import { askEventOf } from '@/features/ask/utils/events'
import { createSseParser, type SseFrame } from '@/features/ask/utils/sse'

const FALLBACK_MESSAGE = '답변을 받지 못했습니다. 잠시 후 다시 시도해 주세요'

/** A refused or broken question; [message] is Korean and meant to be shown as is. */
export class AskError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message)
  }
}

/** What to show for a failed question: the api's own message, or a fallback for anything else. */
export function messageOf(error: unknown): string {
  return error instanceof AskError && error.message ? error.message : FALLBACK_MESSAGE
}

async function refusalOf(response: Response): Promise<AskError> {
  try {
    const { code, message } = (await response.json()) as { code?: unknown; message?: unknown }
    if (typeof code === 'string' && typeof message === 'string') return new AskError(code, message)
  } catch {}
  return new AskError('common.unknown', FALLBACK_MESSAGE)
}

// Asked before every question, which sets the cookie the token must match.
async function csrfToken(signal: AbortSignal): Promise<string> {
  const response = await fetch('/api/auth/csrf', {
    credentials: 'same-origin',
    cache: 'no-store',
    signal,
  })
  if (!response.ok) throw await refusalOf(response)
  return ((await response.json()) as { token: string }).token
}

/**
 * Asks the api and hands each event of its answer to [onEvent] as it arrives. Resolves once the
 * answer is done; a refusal, an `error` event or a stream that ends early rejects with an
 * [AskError], and [signal] stops it.
 */
export async function askQuestion(
  request: AskRequest,
  signal: AbortSignal,
  onEvent: (event: AskEvent) => void,
): Promise<void> {
  const token = await csrfToken(signal)
  const response = await fetch('/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': token },
    body: JSON.stringify(request),
    credentials: 'same-origin',
    cache: 'no-store',
    signal,
  })
  if (!response.ok || !response.body) throw await refusalOf(response)

  let done = false
  const take = (frames: SseFrame[]) => {
    for (const frame of frames) {
      const event = askEventOf(frame)
      if (!event) continue
      if (event.type === 'error') throw new AskError(event.code, event.message)
      onEvent(event)
      if (event.type === 'done') done = true
    }
  }

  const parser = createSseParser()
  const reader = response.body.getReader()
  try {
    for (;;) {
      const chunk = await reader.read()
      if (chunk.done) break
      take(parser.push(chunk.value))
    }
    take(parser.end())
  } catch (error) {
    await reader.cancel().catch(() => {})
    throw error
  }
  if (!done) throw new AskError('ask.incomplete', FALLBACK_MESSAGE)
}
