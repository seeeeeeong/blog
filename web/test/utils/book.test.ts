import { describe, expect, it } from 'vitest'
import { bookByline, chapterLabel, leavesOf, percentOf, progressOf } from '@/utils/book'

type Node = { id: string; done: boolean; sections: Node[] }

const leaf = (id: string, done = false): Node => ({ id, done, sections: [] })

const CHAPTERS: Node[] = [
  { id: '1', done: false, sections: [leaf('1.1', true), leaf('1.2')] },
  leaf('2', true),
  { id: '3', done: true, sections: [leaf('3.1')] },
]

describe('bookByline', () => {
  it('joins the authors, the publisher and the year it came out', () => {
    expect(
      bookByline({ authors: 'Kurose, Ross', publisher: '퍼스트북', publishedOn: '2022-03-02' }),
    ).toBe('Kurose, Ross / 퍼스트북 / 2022')
  })

  it('leaves out what the source does not know', () => {
    expect(bookByline({ authors: null, publisher: '퍼스트북', publishedOn: null })).toBe('퍼스트북')
    expect(bookByline({ authors: 'Kurose', publisher: null })).toBe('Kurose')
  })
})

describe('chapterLabel', () => {
  it('pads a one-digit chapter and keeps any other as it is', () => {
    expect(chapterLabel('3')).toBe('03')
    expect(chapterLabel('12')).toBe('12')
    expect(chapterLabel('A')).toBe('A')
  })
})

describe('leavesOf', () => {
  it('takes each section, and a chapter itself when it has none', () => {
    expect(leavesOf(CHAPTERS).map((node) => node.id)).toEqual(['1.1', '1.2', '2', '3.1'])
  })
})

describe('progressOf', () => {
  it('counts the leaves written, never a chapter that has sections', () => {
    expect(progressOf(CHAPTERS, (node) => node.done)).toEqual({ written: 2, total: 4 })
  })
})

describe('percentOf', () => {
  it('rounds the share written, and is 0 for a book with no sections', () => {
    expect(percentOf({ written: 1, total: 3 })).toBe(33)
    expect(percentOf({ written: 0, total: 0 })).toBe(0)
  })
})
