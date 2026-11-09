import type { PostGeneration } from '@/features/admin/api/types'
import { memoPreview } from '@/features/admin/utils/memo'

type Props = {
  generations: PostGeneration[]
  onOpen: (generation: PostGeneration) => void
}

const WHEN = new Intl.DateTimeFormat('ko-KR', {
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/** The drafts written for the post before, each opened again as if it had just come back. */
export function KeptDrafts({ generations, onOpen }: Props) {
  if (generations.length === 0) return null
  return (
    <section className="mkept" aria-label="지난 초안">
      <h3 className="mkept__title">지난 초안</h3>
      <ul>
        {generations.map((generation) => (
          <li key={generation.id}>
            <button type="button" className="mkept__item" onClick={() => onOpen(generation)}>
              <time dateTime={generation.createdAt}>
                {WHEN.format(new Date(generation.createdAt))}
              </time>
              <span className="mkept__memo">{memoPreview(generation.memo)}</span>
              {generation.draft.revised && <span className="mkept__tag">고쳐 씀</span>}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
