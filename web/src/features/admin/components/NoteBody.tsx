import type { ReactNode } from 'react'
import type { StudyNote } from '@/features/admin/api/types'
import { Icon } from '@/features/admin/components/Icon'

type Props = {
  note: StudyNote | null
  /** The new note's text so far, while the model writes it. */
  streaming: string | null
  /** [note] as the post page renders it, once the server has. */
  rendered: ReactNode
  onGenerate: () => void
}

/** The note as it is written, then rendered; its source stands in until the render arrives. */
export function NoteBody({ note, streaming, rendered, onGenerate }: Props) {
  if (streaming !== null) {
    return (
      <pre className="mdx mstream" aria-busy="true">
        {streaming}
      </pre>
    )
  }
  if (!note) {
    return (
      <div className="nempty">
        <button className="pill pill--accent" type="button" onClick={onGenerate}>
          <Icon name="spark" />
          Generate
        </button>
      </div>
    )
  }
  if (rendered) return <div className="prose epreview">{rendered}</div>
  return <pre className="mdx mstream">{note.bodyMdx}</pre>
}
