'use client'

import { useState } from 'react'
import type { AdminPostSummary, Topic } from '@/features/admin/api/types'
import { FilterTabs } from '@/features/admin/components/FilterTabs'
import { Icon } from '@/features/admin/components/Icon'
import { NewPostDialog } from '@/features/admin/components/NewPostDialog'
import { PageHead } from '@/features/admin/components/PageHead'
import { PostGroups } from '@/features/admin/components/PostGroups'
import { groupPosts, listMeta, type PostFilter } from '@/features/admin/utils/list'

type Props = { posts: readonly AdminPostSummary[]; topics: readonly Topic[] }

/** Every post, drafts first, with a filter and the way to start a new one. */
export function PostIndex({ posts, topics }: Props) {
  const [filter, setFilter] = useState<PostFilter>('all')
  const [composing, setComposing] = useState(false)
  return (
    <main className="apage">
      <PageHead title="Posts" meta={listMeta(posts)} />
      <div className="atoolbar">
        <FilterTabs filter={filter} onChange={setFilter} />
        <button className="pill pill--accent" type="button" onClick={() => setComposing(true)}>
          <Icon name="plus" />
          New post
        </button>
      </div>
      {posts.length === 0 ? (
        <p className="empty">아직 쓴 글이 없습니다.</p>
      ) : (
        <PostGroups groups={groupPosts(posts, filter)} />
      )}
      <NewPostDialog open={composing} topics={topics} onClose={() => setComposing(false)} />
    </main>
  )
}
