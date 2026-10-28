import { spawnSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'

const WEB = join(import.meta.dirname, '..')
const BIOME = join(WEB, 'node_modules', '.bin', 'biome')
const config = JSON.parse(readFileSync(join(WEB, 'biome.json'), 'utf8'))

/** The override each feature folder gets, after the one for every feature: it may import itself. */
function featureOverride(feature: string) {
  return {
    includes: [`src/features/${feature}/**`],
    linter: {
      rules: {
        style: {
          noRestrictedImports: {
            level: 'error',
            options: {
              patterns: [
                {
                  group: [
                    '@/features/**',
                    `!@/features/${feature}/**`,
                    '@/app/**',
                    '../**',
                    './**/../**',
                  ],
                  message:
                    'A feature imports only itself and shared code; compose features in a route.',
                },
              ],
            },
          },
        },
      },
    },
  }
}

// A scratch project with the real rules, outside git so Biome lints whatever is written there.
// posts stands in for a feature to come, with the override a real one gets; topics has none yet.
const project = mkdtempSync(join(tmpdir(), 'blog-imports-'))
writeFileSync(
  join(project, 'biome.json'),
  JSON.stringify({
    ...config,
    $schema: undefined,
    vcs: { enabled: false },
    overrides: [...config.overrides, featureOverride('posts')],
  }),
)
afterAll(() => rmSync(project, { recursive: true, force: true }))

type Diagnostic = { category: string }

function restricts(path: string, specifier: string): boolean {
  mkdirSync(join(project, dirname(path)), { recursive: true })
  writeFileSync(join(project, path), `import { x } from '${specifier}'\nexport const y = x\n`)
  const run = spawnSync(BIOME, ['lint', '--reporter=json', path], {
    cwd: project,
    encoding: 'utf8',
  })
  const report: { diagnostics: Diagnostic[] } = JSON.parse(run.stdout)
  return report.diagnostics.some((d) => d.category === 'lint/style/noRestrictedImports')
}

describe('imports across folders', () => {
  it('keeps a feature out of another feature and out of the routes', () => {
    expect(restricts('src/features/posts/a.ts', '@/features/topics/api/topics')).toBe(true)
    expect(restricts('src/features/posts/b.ts', '@/app/_components/shell')).toBe(true)
  })

  it('lets a feature import itself and shared code', () => {
    expect(restricts('src/features/posts/c.ts', '@/features/posts/utils/posts')).toBe(false)
    expect(restricts('src/features/posts/d.ts', '@/lib/api-url')).toBe(false)
  })

  it('keeps a feature without its own override from importing even itself', () => {
    expect(restricts('src/features/topics/e.ts', '@/features/topics/utils/topics')).toBe(true)
    expect(restricts('src/features/topics/f.ts', '@/features/posts/utils/posts')).toBe(true)
  })

  it.each(['src/components/ui/g.tsx', 'src/hooks/g.ts', 'src/lib/g.ts', 'src/utils/g.ts'])(
    'keeps shared code in %s off the features',
    (path) => {
      expect(restricts(path, '@/features/posts/utils/posts')).toBe(true)
    },
  )

  it('lets a route compose features', () => {
    expect(restricts('src/app/h.tsx', '@/features/posts/views/Post')).toBe(false)
  })

  it('sends an import from another folder through @/', () => {
    expect(restricts('src/app/i.ts', '../lib/api-url')).toBe(true)
    expect(restricts('src/features/posts/views/j.ts', '../utils/posts')).toBe(true)
    expect(restricts('test/k.test.ts', '../src/lib/api-url')).toBe(true)
    expect(restricts('src/lib/l.ts', './../features/posts/utils/posts')).toBe(true)
    expect(restricts('src/lib/m.ts', './a/../../features/posts/utils/posts')).toBe(true)
  })

  it('lets a file import its own folder', () => {
    expect(restricts('src/features/posts/views/n.ts', './Post')).toBe(false)
  })

  it('has a rule for every feature folder', () => {
    const dir = join(WEB, 'src', 'features')
    const features = existsSync(dir)
      ? readdirSync(dir, { withFileTypes: true })
          .filter((entry) => entry.isDirectory())
          .map((entry) => entry.name)
      : []
    for (const feature of features)
      expect(config.overrides).toContainEqual(featureOverride(feature))
  })
})
