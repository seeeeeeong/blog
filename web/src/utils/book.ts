type Byline = {
  authors: string | null
  publisher: string | null
  /** `2022-03-02`. */
  publishedOn?: string | null
}

/** `Kurose, Ross / 퍼스트북 / 2022`, leaving out what the source does not know. */
export function bookByline({ authors, publisher, publishedOn }: Byline): string {
  return [authors, publisher, publishedOn?.slice(0, 4)].filter(Boolean).join(' / ')
}

/** `03` for the third chapter; a lettered one, an appendix, stays as it is. */
export function chapterLabel(number: string): string {
  return /^\d$/.test(number) ? `0${number}` : number
}

type Node<T> = { sections: readonly T[] }

/** What gets a post of its own: each section, or a chapter that has none. */
export function leavesOf<T extends Node<T>>(chapters: readonly T[]): T[] {
  return chapters.flatMap((chapter) =>
    chapter.sections.length > 0 ? [...chapter.sections] : [chapter],
  )
}

export type Progress = { written: number; total: number }

/** How many of [chapters]' leaves [isWritten] holds for. */
export function progressOf<T extends Node<T>>(
  chapters: readonly T[],
  isWritten: (leaf: T) => boolean,
): Progress {
  const leaves = leavesOf(chapters)
  return { written: leaves.filter(isWritten).length, total: leaves.length }
}

/** The share written, from 0 to 100; 0 for a book with no sections. */
export function percentOf({ written, total }: Progress): number {
  return total === 0 ? 0 : Math.round((written / total) * 100)
}
