import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { cache } from 'react'
import type { Post } from '@/features/posts/api/types'
import { splitFrontmatter } from '@/features/posts/utils/frontmatter'

/**
 * One `.mdx` file a post, named by its slug. Every page is prerendered from them, so the reads
 * opt out of tracing: the server never opens them at run time.
 */
export const POSTS_DIR = path.join(process.cwd(), 'content', 'posts')

const EXTENSION = '.mdx'

function required(data: Record<string, string>, key: string, file: string): string {
  const value = data[key]
  if (!value) throw new Error(`${file} has no ${key} in its frontmatter`)
  return value
}

/** A post from its file; a missing field or a date that does not parse stops the build. */
export function parsePost(slug: string, source: string): Post {
  const file = `${slug}${EXTENSION}`
  const { data, body } = splitFrontmatter(source)
  const date = required(data, 'date', file)
  if (Number.isNaN(Date.parse(date))) throw new Error(`${file} has a date that does not parse`)
  return {
    slug,
    title: required(data, 'title', file),
    description: required(data, 'description', file),
    date: new Date(date).toISOString(),
    body,
    draft: data.draft === 'true',
  }
}

async function fileNames(dir: string): Promise<string[]> {
  try {
    return await readdir(/*turbopackIgnore: true*/ dir)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw error
  }
}

/** Every post that is not a draft, newest first. */
export const loadPosts = cache(async (dir: string = POSTS_DIR): Promise<Post[]> => {
  const names = (await fileNames(dir)).filter((name) => name.endsWith(EXTENSION))
  const posts = await Promise.all(
    names.map(async (name) =>
      parsePost(
        name.slice(0, -EXTENSION.length),
        await readFile(
          /*turbopackIgnore: true*/ path.join(/*turbopackIgnore: true*/ dir, name),
          'utf8',
        ),
      ),
    ),
  )
  return posts.filter((post) => !post.draft).sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
})

/** The post at [slug], or null when there is none or it is a draft. */
export async function loadPost(slug: string, dir: string = POSTS_DIR): Promise<Post | null> {
  return (await loadPosts(dir)).find((post) => post.slug === slug) ?? null
}
