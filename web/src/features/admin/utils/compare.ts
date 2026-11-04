/** Lines both sides share, or a change the admin may take or leave. */
export type CompareBlock =
  | { kind: 'same'; lines: string[] }
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
  for (const step of stepsBetween(linesOf(before), linesOf(after))) {
    const last = blocks.at(-1)
    if (step.kind === 'same') {
      if (last?.kind === 'same') last.lines.push(step.line)
      else blocks.push({ kind: 'same', lines: [step.line] })
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
