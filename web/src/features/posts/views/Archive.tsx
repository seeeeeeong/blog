import './archive.css'
import Link from 'next/link'
import type { ArchiveData } from '@/features/posts/api/types'
import { byYear, postHref } from '@/features/posts/utils/archive'
import { isoDay, monthDay } from '@/utils/date'

/** Every published post, under the year it came out, newest first. */
export function Archive({ archive }: { archive: ArchiveData | null }) {
  return (
    <main className="archive">
      <h1 className="archive__title">Archives</h1>
      {archive ? (
        byYear(archive.posts).map(({ year, posts }) => (
          <section key={year}>
            <h2 className="archive__year">{year}</h2>
            <ul className="archive__list">
              {posts.map((post) => (
                <li key={post.slug} className="archive__entry">
                  <time className="archive__date" dateTime={isoDay(post.publishedAt)}>
                    {monthDay(post.publishedAt)}
                  </time>
                  <div className="archive__link">
                    <Link href={postHref(post.slug)}>{post.title}</Link>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))
      ) : (
        <p className="empty">글 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
      )}
    </main>
  )
}
