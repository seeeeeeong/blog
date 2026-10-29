export const SOURCE_URL = 'https://github.com/seeeeeeong/blog-v2'

export type Commit = { label: string; href: string }

/** The commit a build was made from; a build given none is a local one. */
export function commitOf(sha: string | undefined): Commit {
  const short = sha?.trim().slice(0, 7)
  return short
    ? { label: short, href: `${SOURCE_URL}/commit/${short}` }
    : { label: 'local', href: SOURCE_URL }
}
