import type { PostSummary } from '@/features/posts/api/types'
import { ArrowCard } from '@/features/posts/components/ArrowCard'
import { byYear } from '@/features/posts/utils/archive'

/** Every post under the year it came out, newest first. */
export function BlogIndex({ posts }: { posts: readonly PostSummary[] }) {
  return (
    <div className="space-y-10">
      <h1 className="animate font-semibold text-black dark:text-white">Blog</h1>
      <div className="space-y-4">
        {byYear(posts).map(({ year, posts: inYear }) => (
          <section key={year} className="animate space-y-4">
            <div className="font-semibold text-black dark:text-white">{year}</div>
            <div>
              <ul className="flex flex-col gap-4">
                {inYear.map((post) => (
                  <li key={post.slug}>
                    <ArrowCard post={post} />
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
