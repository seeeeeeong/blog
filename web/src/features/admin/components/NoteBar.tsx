import type { AdminPostSummary } from '@/features/admin/api/types'
import { Icon } from '@/features/admin/components/Icon'
import { postEditHref } from '@/features/admin/utils/list'

type Props = {
  hasNote: boolean
  streaming: boolean
  /** The post written for the section, if any. */
  post: AdminPostSummary | null
  writingPost: boolean
  onGenerate: () => void
  onWritePost: () => void
}

/** The note page's floating bar: write the note again, and go on to the section's post. */
export function NoteBar(props: Props) {
  const { hasNote, streaming, post, writingPost, onGenerate, onWritePost } = props
  return (
    <div className="ebar">
      <div className="dock__bar">
        <span className="mono ebar__save" aria-live="polite">
          {streaming ? 'Writing…' : 'Private'}
        </span>
        <span className="dock__divider" aria-hidden="true" />
        {hasNote && (
          <button className="dock__item" type="button" disabled={streaming} onClick={onGenerate}>
            <Icon name="spark" />
            Regenerate
          </button>
        )}
        {post ? (
          <a className="dock__item dock__item--accent" href={postEditHref(post.id)}>
            Open post
          </a>
        ) : (
          <button
            className="dock__item dock__item--accent"
            type="button"
            disabled={writingPost}
            onClick={onWritePost}
          >
            Write post
          </button>
        )}
      </div>
    </div>
  )
}
