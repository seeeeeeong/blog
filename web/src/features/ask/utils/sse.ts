/** One server-sent event: its name, `message` when the frame gives none, and its data lines joined. */
export type SseFrame = { event: string; data: string }

const LINE_END = /\r\n|\r|\n/g

/**
 * Reads server-sent events from a byte stream, chunk by chunk. A frame, a line or a character may
 * be split across chunks; comments (`: ping`) and frames without data yield nothing.
 */
export function createSseParser() {
  const decoder = new TextDecoder()
  let buffer = ''
  let event = ''
  let data: string[] = []

  const dispatch = (frames: SseFrame[]) => {
    if (data.length > 0) frames.push({ event: event || 'message', data: data.join('\n') })
    event = ''
    data = []
  }

  const read = (line: string, frames: SseFrame[]) => {
    if (line === '') return dispatch(frames)
    if (line.startsWith(':')) return
    const colon = line.indexOf(':')
    const field = colon < 0 ? line : line.slice(0, colon)
    const value = colon < 0 ? '' : line.slice(colon + 1).replace(/^ /, '')
    if (field === 'event') event = value
    else if (field === 'data') data.push(value)
  }

  const drain = (final: boolean): SseFrame[] => {
    const frames: SseFrame[] = []
    let start = 0
    for (const match of buffer.matchAll(LINE_END)) {
      // A lone `\r` at the end may be the first half of `\r\n`.
      if (!final && match[0] === '\r' && match.index === buffer.length - 1) break
      read(buffer.slice(start, match.index), frames)
      start = match.index + match[0].length
    }
    buffer = buffer.slice(start)
    return frames
  }

  return {
    push(chunk: Uint8Array): SseFrame[] {
      buffer += decoder.decode(chunk, { stream: true })
      return drain(false)
    },
    /** The frames left when the stream ends; one never closed by a blank line is dropped. */
    end(): SseFrame[] {
      buffer += decoder.decode()
      return drain(true)
    },
  }
}
