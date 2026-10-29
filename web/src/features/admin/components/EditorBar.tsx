import { Icon } from '@/features/admin/components/Icon'
import { type Busy, saveLabel } from '@/features/admin/utils/editor'

export type EditorMode = 'write' | 'preview'

const MODES: { mode: EditorMode; label: string }[] = [
  { mode: 'write', label: 'Write' },
  { mode: 'preview', label: 'Preview' },
]

type Props = {
  mode: EditorMode
  onMode: (mode: EditorMode) => void
  published: boolean
  dirty: boolean
  busy: Busy
  savedAt: Date | null
  onSave: () => void
  onPublish: () => void
  onMemo: () => void
}

/**
 * The floating bar at the bottom of the editor. A draft saves in place and can be drafted from a
 * memo; a published post changes only by publishing again, so it has neither.
 */
export function EditorBar(props: Props) {
  const { mode, onMode, published, dirty, busy, savedAt, onSave, onPublish, onMemo } = props
  return (
    <div className="ebar">
      <div className="dock__bar">
        <span className="mono ebar__save" aria-live="polite">
          {saveLabel(dirty, busy, savedAt)}
        </span>
        <span className="dock__divider" aria-hidden="true" />
        {!published && (
          <button className="dock__item" type="button" onClick={onMemo}>
            <Icon name="spark" />
            From memo
          </button>
        )}
        {MODES.map((item) => (
          <button
            key={item.mode}
            className="dock__item"
            type="button"
            aria-pressed={item.mode === mode}
            onClick={() => onMode(item.mode)}
          >
            {item.label}
          </button>
        ))}
        <span className="dock__divider" aria-hidden="true" />
        {!published && (
          <button
            className="dock__item"
            type="button"
            disabled={!dirty || busy !== null}
            onClick={onSave}
          >
            Save draft
          </button>
        )}
        <button
          className="dock__item dock__item--accent"
          type="button"
          disabled={busy !== null || (published && !dirty)}
          onClick={onPublish}
        >
          {published ? 'Republish' : 'Publish'}
        </button>
      </div>
    </div>
  )
}
