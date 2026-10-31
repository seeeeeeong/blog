'use client'

import './archive.css'
import type { ArchiveData } from '@/features/posts/api/types'
import { ArchiveTabs } from '@/features/posts/components/ArchiveTabs'
import { DateGroups } from '@/features/posts/components/DateGroups'
import { TopicGroups } from '@/features/posts/components/TopicGroups'
import { useArchiveView } from '@/features/posts/hooks/useArchiveView'

/** Every published post, by date or by topic as the location's fragment says. */
export function Archive({ archive }: { archive: ArchiveData | null }) {
  const view = useArchiveView()
  if (!archive) {
    return (
      <main className="index">
        <p className="empty">글 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
      </main>
    )
  }
  if (archive.posts.length === 0) {
    return <main className="index" />
  }
  return (
    <main className="index">
      <ArchiveTabs view={view} />
      <ul className="group">
        {view === 'date' ? (
          <DateGroups posts={archive.posts} />
        ) : (
          <TopicGroups posts={archive.posts} topics={archive.topics} />
        )}
      </ul>
    </main>
  )
}
