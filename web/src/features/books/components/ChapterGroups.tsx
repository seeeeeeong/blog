import Link from 'next/link'
import { Scramble } from '@/components/ui/Scramble'
import type { BookSection } from '@/features/books/api/types'
import { chapterProgress, postHref } from '@/features/books/utils/books'
import { chapterLabel, leavesOf } from '@/utils/book'
import { shortDate } from '@/utils/date'

/** A section links to its post once that is published; until then it is plain text. */
function SectionRow({ section }: { section: BookSection }) {
  const { post } = section
  const cells = (
    <>
      <Scramble className="row__meta mono" text={section.number} />
      <Scramble text={section.title} />
      <span className="row__meta mono">{post ? shortDate(post.publishedAt) : '—'}</span>
    </>
  )
  return (
    <li>
      {post ? (
        <Link className="row row--topic" href={postHref(post.slug)}>
          {cells}
        </Link>
      ) : (
        <div className="row row--topic row--pending">{cells}</div>
      )}
    </li>
  )
}

function ChapterCount({ chapter }: { chapter: BookSection }) {
  const { written, total } = chapterProgress(chapter)
  return <span className="mono group__count">{`(${written}/${total})`}</span>
}

export function ChapterGroups({ chapters }: { chapters: readonly BookSection[] }) {
  return chapters.map((chapter) => (
    <li key={chapter.id}>
      <p className="group__label group__label--topic">
        <span className="mono group__count">{chapterLabel(chapter.number)}</span>
        {chapter.title}
        <ChapterCount chapter={chapter} />
      </p>
      <ul className="group">
        {leavesOf([chapter]).map((section) => (
          <SectionRow key={section.id} section={section} />
        ))}
      </ul>
    </li>
  ))
}
