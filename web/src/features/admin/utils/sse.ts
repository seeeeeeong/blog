/** One server-sent event: its name, `message` when it has none, and its data lines joined. */
export type SseFrame = { event: string; data: string }

function fieldOf(line: string): [string, string] {
  const colon = line.indexOf(':')
  if (colon === -1) return [line, '']
  return [line.slice(0, colon), line.slice(colon + 1).replace(/^ /, '')]
}

/**
 * Turns decoded text into frames as it arrives, so a frame may span chunks. Comment lines, such
 * as the api's `: ping`, and frames without data are dropped.
 */
export function createSseParser(): (chunk: string) => SseFrame[] {
  let pending = ''
  let event = ''
  let data: string[] = []

  const end = (): SseFrame[] => {
    const frame = data.length > 0 ? [{ event: event || 'message', data: data.join('\n') }] : []
    event = ''
    data = []
    return frame
  }

  const read = (line: string): SseFrame[] => {
    if (line === '') return end()
    if (line.startsWith(':')) return []
    const [field, value] = fieldOf(line)
    if (field === 'event') event = value
    if (field === 'data') data.push(value)
    return []
  }

  return (chunk) => {
    const lines = (pending + chunk).split('\n')
    pending = lines.pop() ?? ''
    return lines.flatMap((line) => read(line.endsWith('\r') ? line.slice(0, -1) : line))
  }
}

/** The frames of an event stream's body; a character split across chunks is decoded whole. */
export async function* readFrames(body: ReadableStream<Uint8Array>): AsyncGenerator<SseFrame> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  const parse = createSseParser()
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      yield* parse(decoder.decode(value, { stream: true }))
    }
    yield* parse(decoder.decode())
  } finally {
    await reader.cancel().catch(() => {})
  }
}
