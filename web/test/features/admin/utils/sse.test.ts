import { describe, expect, it } from 'vitest'
import { createSseParser, readFrames, type SseFrame } from '@/features/admin/utils/sse'

const bytes = (text: string) => new TextEncoder().encode(text)

function bodyOf(chunks: Uint8Array[]): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk)
      controller.close()
    },
  })
}

async function framesOf(chunks: Uint8Array[]): Promise<SseFrame[]> {
  const frames: SseFrame[] = []
  for await (const frame of readFrames(bodyOf(chunks))) frames.push(frame)
  return frames
}

const STREAM = [
  ': open',
  '',
  'event: text',
  'data: {"text":"TCP 는 "}',
  '',
  ': ping',
  '',
  'event: text',
  'data: {"text":"세 번 악수한다"}',
  '',
  'event: done',
  'data: {"bodyMdx":"TCP 는 세 번 악수한다"}',
  '',
  '',
].join('\n')

const EXPECTED: SseFrame[] = [
  { event: 'text', data: '{"text":"TCP 는 "}' },
  { event: 'text', data: '{"text":"세 번 악수한다"}' },
  { event: 'done', data: '{"bodyMdx":"TCP 는 세 번 악수한다"}' },
]

describe('createSseParser', () => {
  it('reads named frames and drops the comments the api sends to keep the line open', () => {
    expect(createSseParser()(STREAM)).toEqual(EXPECTED)
  })

  it('holds a frame back until the blank line that ends it, however the chunks fall', () => {
    const parse = createSseParser()

    expect(parse('event: te')).toEqual([])
    expect(parse('xt\ndata: {"te')).toEqual([])
    expect(parse('xt":"a"}\n')).toEqual([])
    expect(parse('\nevent: done\ndata: {}\n\n')).toEqual([
      { event: 'text', data: '{"text":"a"}' },
      { event: 'done', data: '{}' },
    ])
  })

  it('gives the same frames when the stream is cut at every character', () => {
    const parse = createSseParser()

    expect([...STREAM].flatMap((char) => parse(char))).toEqual(EXPECTED)
  })

  it('joins data lines, takes CRLF line ends, and names an unnamed frame message', () => {
    const parse = createSseParser()

    expect(parse('data: one\r\ndata:two\r\n\r')).toEqual([])
    expect(parse('\n')).toEqual([{ event: 'message', data: 'one\ntwo' }])
  })

  it('drops a frame with no data, and fields it does not know', () => {
    expect(createSseParser()('event: text\nid: 7\nretry: 10\n\nevent: done\n\n')).toEqual([])
  })

  it('reads an error frame as any other', () => {
    const parse = createSseParser()

    expect(
      parse('event: error\ndata: {"code":"llm.failed","message":"AI 가 응답하지 않습니다"}\n\n'),
    ).toEqual([
      { event: 'error', data: '{"code":"llm.failed","message":"AI 가 응답하지 않습니다"}' },
    ])
  })
})

describe('readFrames', () => {
  it('decodes a Korean character split across chunks whole', async () => {
    const encoded = bytes('event: text\ndata: {"text":"악수"}\n\n')
    const cut = encoded.indexOf(0xec) + 1

    const frames = await framesOf([encoded.slice(0, cut), encoded.slice(cut)])

    expect(frames).toEqual([{ event: 'text', data: '{"text":"악수"}' }])
  })

  it('gives the same frames when the bytes arrive one at a time', async () => {
    const encoded = bytes(STREAM)

    const frames = await framesOf([...encoded].map((byte) => Uint8Array.of(byte)))

    expect(frames).toEqual(EXPECTED)
  })

  it('drops a frame the stream cut off before its blank line', async () => {
    const frames = await framesOf([
      bytes('event: text\ndata: {"text":"a"}\n\nevent: done\ndata: {"bo'),
    ])

    expect(frames).toEqual([{ event: 'text', data: '{"text":"a"}' }])
  })

  it('lets go of the body when the reader stops early', async () => {
    let cancelled = false
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes('event: done\ndata: {}\n\n'))
      },
      cancel() {
        cancelled = true
      },
    })

    for await (const frame of readFrames(body)) {
      expect(frame.event).toBe('done')
      break
    }

    expect(cancelled).toBe(true)
  })
})
