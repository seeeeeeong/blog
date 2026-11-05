/** Lines both sides share, or a change the admin may take or leave. */
export type CompareBlock =
  | { kind: 'same'; id: number; lines: string[] }
  | { kind: 'change'; id: number; before: string[]; after: string[] }

function linesOf(text: string): string[] {
  return text === '' ? [] : text.split('\n')
}

/** For each pair of positions, how many lines the two tails can still share. */
function commonTails(before: string[], after: string[]): (i: number, j: number) => number {
  const width = after.length + 1
  const table = new Uint32Array((before.length + 1) * width)
  const at = (i: number, j: number) => table[i * width + j] ?? 0
  for (let i = before.length - 1; i >= 0; i--) {
    for (let j = after.length - 1; j >= 0; j--) {
      table[i * width + j] =
        before[i] === after[j] ? at(i + 1, j + 1) + 1 : Math.max(at(i + 1, j), at(i, j + 1))
    }
  }
  return at
}

type Step = { kind: 'same' | 'before' | 'after'; line: string }

function stepsBetween(before: string[], after: string[]): Step[] {
  const tails = commonTails(before, after)
  const steps: Step[] = []
  let i = 0
  let j = 0
  while (i < before.length || j < after.length) {
    if (i < before.length && before[i] === after[j]) {
      steps.push({ kind: 'same', line: before[i++] ?? '' })
      j++
    } else if (i < before.length && tails(i + 1, j) >= tails(i, j + 1)) {
      steps.push({ kind: 'before', line: before[i++] ?? '' })
    } else {
      steps.push({ kind: 'after', line: after[j++] ?? '' })
    }
  }
  return steps
}

/** The two texts line by line, with neighbouring changes gathered into one block. */
export function compareBodies(before: string, after: string): CompareBlock[] {
  const blocks: CompareBlock[] = []
  let changes = 0
  let sames = 0
  for (const step of stepsBetween(linesOf(before), linesOf(after))) {
    const last = blocks.at(-1)
    if (step.kind === 'same') {
      if (last?.kind === 'same') last.lines.push(step.line)
      else blocks.push({ kind: 'same', id: sames++, lines: [step.line] })
      continue
    }
    const block =
      last?.kind === 'change'
        ? last
        : { kind: 'change' as const, id: changes++, before: [], after: [] }
    if (block !== last) blocks.push(block)
    block[step.kind].push(step.line)
  }
  return blocks
}

export function changeIds(blocks: CompareBlock[]): number[] {
  return blocks.flatMap((block) => (block.kind === 'change' ? [block.id] : []))
}

/** The body with the changes in [taken] applied and the others left as they were. */
export function applyChanges(blocks: CompareBlock[], taken: ReadonlySet<number>): string {
  return blocks
    .flatMap((block) => {
      if (block.kind === 'same') return block.lines
      return taken.has(block.id) ? block.after : block.before
    })
    .join('\n')
}

/** A run of words on one side of a change, with [start] its offset, and whether the other side lacks it. */
export type WordPart = { start: number; text: string; changed: boolean }

// The comparison takes this much memory and time, and a paragraph is far below it.
const MAX_COMPARED_WORD_PAIRS = 1_000_000

function partsOfSide(steps: Step[], side: 'before' | 'after'): WordPart[] {
  const words = steps.filter((step) => step.kind === 'same' || step.kind === side)
  const parts: WordPart[] = []
  let start = 0
  words.forEach((word, index) => {
    const between =
      word.line.trim() === '' && words[index - 1]?.kind === side && words[index + 1]?.kind === side
    const changed = word.kind === side || between
    const last = parts.at(-1)
    if (last?.changed === changed) last.text += word.line
    else parts.push({ start, text: word.line, changed })
    start += word.line.length
  })
  return parts
}

/** Each side of a change with the words that differ marked, so a small edit in a long paragraph shows. */
export function changedWords(before: string, after: string) {
  const wordsBefore = before.match(/\s+|\S+/g) ?? []
  const wordsAfter = after.match(/\s+|\S+/g) ?? []
  const pairs = wordsBefore.length * wordsAfter.length
  if (pairs === 0 || pairs > MAX_COMPARED_WORD_PAIRS) {
    return {
      before: [{ start: 0, text: before, changed: false }],
      after: [{ start: 0, text: after, changed: false }],
    }
  }
  const steps = stepsBetween(wordsBefore, wordsAfter)
  return { before: partsOfSide(steps, 'before'), after: partsOfSide(steps, 'after') }
}
