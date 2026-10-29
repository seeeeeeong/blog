import type { AdminBookSection } from '@/features/admin/api/types'
import { bookProgress, noteHref, postStatus, sectionAnchor } from '@/features/admin/utils/books'
import { postEditHref } from '@/features/admin/utils/list'
import { chapterLabel } from '@/utils/book'

type Props = {
  bookId: string
  chapters: readonly AdminBookSection[]
  /** The section whose post is being made, which holds every Write post back. */
  writing: string | null
  onWrite: (sectionId: string) => void
}

type RowProps = Omit<Props, 'chapters'> & { section: AdminBookSection }

function SectionRow({ bookId, section, writing, onWrite }: RowProps) {
  const { post } = section
  const status = postStatus(post)
  return (
    <li id={sectionAnchor(section.id)}>
      <div className="row bsection">
        <span className="row__meta mono">{section.number}</span>
        <span>{section.title}</span>
        <span className={status.draft ? 'row__meta mono is-draft' : 'row__meta mono'}>
          {status.label}
        </span>
        <span className="bsection__actions">
          <a className="mono mlink" href={noteHref(bookId, section.id)}>
            {section.noteCreatedAt ? 'View note' : 'Write note'}
          </a>
          {post ? (
            <a className="mono mlink" href={postEditHref(post.id)}>
              Open post
            </a>
          ) : (
            <button
              className="mono mlink"
              type="button"
              disabled={writing !== null}
              onClick={() => onWrite(section.id)}
            >
              Write post
            </button>
          )}
        </span>
      </div>
    </li>
  )
}

/** The book's chapters and their sections, each with its study note and the post written for it. */
export function BookContents({ bookId, chapters, writing, onWrite }: Props) {
  return (
    <ul className="group">
      {chapters.map((chapter) => {
        const { written, total } = bookProgress({ chapters: [chapter] })
        const leaves = chapter.sections.length > 0 ? chapter.sections : [chapter]
        return (
          <li key={chapter.id}>
            <p className="group__label group__label--topic">
              <span className="mono group__count">{chapterLabel(chapter.number)}</span>
              {chapter.title}
              <span className="mono group__count">{`(${written}/${total})`}</span>
            </p>
            <ul className="group">
              {leaves.map((section) => (
                <SectionRow
                  key={section.id}
                  bookId={bookId}
                  section={section}
                  writing={writing}
                  onWrite={onWrite}
                />
              ))}
            </ul>
          </li>
        )
      })}
    </ul>
  )
}
