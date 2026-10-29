import { describe, expect, it } from 'vitest'
import { createSseParser, type SseFrame } from '@/features/ask/utils/sse'

const bytes = (text: string) => new TextEncoder().encode(text)

function readAll(chunks: Uint8Array[]): SseFrame[] {
  const parser = createSseParser()
  return [...chunks.flatMap((chunk) => parser.push(chunk)), ...parser.end()]
}

describe('createSseParser', () => {
  it('reads named events and skips the comments that open and keep the stream alive', () => {
    const frames = readAll([
      bytes(
        ': open\n\nevent: sources\ndata: {"posts":[]}\n\n: ping\n\nevent: text\ndata: {"text":"a"}\n\n',
      ),
    ])

    expect(frames).toEqual([
      { event: 'sources', data: '{"posts":[]}' },
      { event: 'text', data: '{"text":"a"}' },
    ])
  })

  it('holds a frame split across chunks until its blank line arrives', () => {
    const parser = createSseParser()

    expect(parser.push(bytes('event: te'))).toEqual([])
    expect(parser.push(bytes('xt\ndata: {"text":'))).toEqual([])
    expect(parser.push(bytes('"b"}\n'))).toEqual([])
    expect(parser.push(bytes('\nevent: done\ndata: {}\n\n'))).toEqual([
      { event: 'text', data: '{"text":"b"}' },
      { event: 'done', data: '{}' },
    ])
  })

  it('keeps a Korean character whose bytes are split across chunks', () => {
    const whole = bytes('event: text\ndata: {"text":"한글"}\n\n')
    const cut = whole.indexOf(0xed) + 1

    expect(readAll([whole.slice(0, cut), whole.slice(cut)])).toEqual([
      { event: 'text', data: '{"text":"한글"}' },
    ])
  })

  it('reads every byte arriving on its own', () => {
    const whole = bytes('event: text\ndata: {"text":"가나"}\n\nevent: done\ndata: {}\n\n')

    expect(readAll([...whole].map((byte) => Uint8Array.of(byte)))).toEqual([
      { event: 'text', data: '{"text":"가나"}' },
      { event: 'done', data: '{}' },
    ])
  })

  it('reads an error event like any other', () => {
    expect(
      readAll([bytes('event: error\ndata: {"code":"llm.incomplete","message":"끊겼습니다"}\n\n')]),
    ).toEqual([{ event: 'error', data: '{"code":"llm.incomplete","message":"끊겼습니다"}' }])
  })

  it('takes CRLF line ends, even when a chunk ends between CR and LF', () => {
    expect(readAll([bytes('event: done\r\ndata: {}\r'), bytes('\n\r\n')])).toEqual([
      { event: 'done', data: '{}' },
    ])
  })

  it('joins data lines and names an unnamed event message', () => {
    expect(readAll([bytes('data: a\ndata: b\n\n')])).toEqual([{ event: 'message', data: 'a\nb' }])
  })

  it('drops a frame without data and one the stream never finished', () => {
    expect(readAll([bytes('event: done\n\nevent: text\ndata: {"text":"cut"}\n')])).toEqual([])
  })
})
