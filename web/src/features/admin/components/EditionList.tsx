import type { BookEdition } from '@/features/admin/api/types'
import { editionNote } from '@/features/admin/utils/books'
import { bookByline } from '@/utils/book'

type Props = {
  editions: readonly BookEdition[]
  picked: string | null
  onPick: (sourceRef: string) => void
}

/** What a search found; an edition already here, or whose contents read as nothing, is not picked. */
export function EditionList({ editions, picked, onPick }: Props) {
  if (editions.length === 0) return <p className="bnone">검색 결과가 없습니다.</p>
  return (
    <ul className="group bresults">
      {editions.map((edition) => (
        <li key={edition.sourceRef} className="bedition">
          <button
            className="row brow"
            type="button"
            aria-pressed={edition.sourceRef === picked}
            disabled={!edition.hasContents || edition.imported}
            onClick={() => onPick(edition.sourceRef)}
          >
            <span className="brow__title">
              <span>{edition.title}</span>
              <span className="mono brow__by">{bookByline(edition)}</span>
            </span>
            <span className="row__meta mono">{editionNote(edition)}</span>
          </button>
          <a className="mono mlink" href={edition.sourceUrl} target="_blank" rel="noreferrer">
            YES24
          </a>
        </li>
      ))}
    </ul>
  )
}
