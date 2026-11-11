const FENCE = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/

/** The `key: value` lines between the opening `---` fences, and the text after them. */
export type Split = { data: Record<string, string>; body: string }

function unquote(value: string): string {
  return /^(["']).*\1$/.test(value) ? value.slice(1, -1) : value
}

/** A file's frontmatter as plain strings; a file without one is all body. */
export function splitFrontmatter(source: string): Split {
  const match = FENCE.exec(source)
  if (!match) return { data: {}, body: source }
  const data: Record<string, string> = {}
  for (const line of (match[1] ?? '').split(/\r?\n/)) {
    const colon = line.indexOf(':')
    if (colon <= 0) continue
    data[line.slice(0, colon).trim()] = unquote(line.slice(colon + 1).trim())
  }
  return { data, body: source.slice(match[0].length) }
}
