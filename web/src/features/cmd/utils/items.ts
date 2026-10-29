import { FEED_PATH } from '@/lib/site'
import { shortDate } from '@/utils/date'

/** A published post as the palette searches it; the route that lists posts maps them in. */
export type CmdPost = {
  href: string
  title: string
  /** The title of the post's topic. */
  topic: string
  summary: string
  /** An ISO-8601 instant. */
  publishedAt: string
}

/** `root` lists the commands; `posts` searches only the posts. */
export type CmdMode = 'root' | 'posts'

export type CmdIconName = 'search' | 'arrow' | 'folder' | 'doc'

/**
 * What choosing an item does. A `page` is loaded by the browser: a fragment the archive follows,
 * or a file such as the feed. A `route` goes through the app's router.
 */
export type CmdAction =
  | { type: 'search' }
  | { type: 'route'; href: string }
  | { type: 'page'; href: string }
  | { type: 'external'; href: string }

export type CmdItem = {
  id: string
  group: string
  label: string
  hint?: string
  icon: CmdIconName
  action: CmdAction
}

export type CmdGroup = { name: string; entries: { item: CmdItem; index: number }[] }

const GITHUB = 'https://github.com/seeeeeeong'

function commands(latestHref: string | undefined): CmdItem[] {
  const latest: CmdItem[] = latestHref
    ? [
        {
          id: 'latest',
          group: 'Navigation',
          label: 'Latest',
          icon: 'arrow',
          action: { type: 'route', href: latestHref },
        },
      ]
    : []
  return [
    {
      id: 'search',
      group: 'Tools',
      label: 'Search posts...',
      icon: 'search',
      action: { type: 'search' },
    },
    {
      id: 'index',
      group: 'Navigation',
      label: 'Index',
      icon: 'arrow',
      action: { type: 'page', href: '/#date' },
    },
    {
      id: 'topics',
      group: 'Navigation',
      label: 'Topics',
      icon: 'arrow',
      action: { type: 'page', href: '/#topic' },
    },
    {
      id: 'books',
      group: 'Navigation',
      label: 'Books',
      icon: 'arrow',
      action: { type: 'route', href: '/books' },
    },
    ...latest,
    {
      id: 'rss',
      group: 'Navigation',
      label: 'RSS',
      icon: 'arrow',
      action: { type: 'page', href: FEED_PATH },
    },
    {
      id: 'github',
      group: 'Links',
      label: 'GitHub',
      hint: 'github.com/seeeeeeong',
      icon: 'folder',
      action: { type: 'external', href: GITHUB },
    },
  ]
}

function postItem(post: CmdPost): CmdItem {
  return {
    id: `post:${post.href}`,
    group: 'Posts',
    label: post.title,
    hint: shortDate(post.publishedAt),
    icon: 'doc',
    action: { type: 'route', href: post.href },
  }
}

const contains = (text: string, needle: string) => text.toLowerCase().includes(needle)

/** Whether [query] appears in the post's title, its topic or its summary, ignoring case. */
export function matchesPost(post: CmdPost, query: string): boolean {
  const needle = query.trim().toLowerCase()
  return [post.title, post.topic, post.summary].some((text) => contains(text, needle))
}

/**
 * The items to show, in order. The root lists the commands, and with a query those it matches
 * followed by the matching posts; the posts mode lists only posts, every one for an empty query.
 */
export function visibleItems(
  mode: CmdMode,
  query: string,
  posts: readonly CmdPost[],
  latestHref?: string,
): CmdItem[] {
  const needle = query.trim().toLowerCase()
  const found = posts.filter((post) => matchesPost(post, needle)).map(postItem)
  if (mode === 'posts') return found
  if (!needle) return commands(latestHref)
  return [...commands(latestHref).filter((item) => contains(item.label, needle)), ...found]
}

/** Runs of items under one group name, each item with its place in the whole list. */
export function groupsOf(items: readonly CmdItem[]): CmdGroup[] {
  const groups: CmdGroup[] = []
  items.forEach((item, index) => {
    const last = groups.at(-1)
    if (last?.name === item.group) last.entries.push({ item, index })
    else groups.push({ name: item.group, entries: [{ item, index }] })
  })
  return groups
}
