import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ISO = join(import.meta.dirname, '..', '..', '..', '..', 'src', 'features', 'widgets', 'iso')
const SKILL = join(
  import.meta.dirname,
  '..',
  '..',
  '..',
  '..',
  '..',
  '.claude',
  'skills',
  'anatomy',
)

type Upstream = {
  commitHash: string
  files: Record<
    string,
    { from: string; sha256: string; upstreamSha256?: string; modified?: string }
  >
}

const upstream: Upstream = JSON.parse(readFileSync(join(ISO, 'upstream.json'), 'utf8'))

const sha256 = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex')

describe('the vendored figure kit', () => {
  it.each(Object.entries(upstream.files))('keeps %s as recorded', (file, { sha256: recorded }) => {
    expect(sha256(join(ISO, file))).toBe(recorded)
  })

  it('matches the copy kept with the skill, but for the recorded changes', () => {
    for (const [file, { from, upstreamSha256, modified }] of Object.entries(upstream.files)) {
      const original = sha256(join(SKILL, from))
      if (modified) expect(original).toBe(upstreamSha256)
      else expect(sha256(join(ISO, file))).toBe(original)
    }
  })

  it('names the same revision as the skill', () => {
    const notes = readFileSync(join(SKILL, 'UPSTREAM.md'), 'utf8')
    expect(notes).toContain(`| Revision | ${upstream.commitHash} |`)
  })
})
