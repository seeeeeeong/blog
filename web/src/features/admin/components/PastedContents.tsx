import type { BookContents } from '@/features/admin/api/types'
import { contentsMeta } from '@/features/admin/utils/books'

type Props = {
  value: string
  /** How [value] reads; null until it is checked, and again once it changes. */
  outline: BookContents | null
  busy: boolean
  onChange: (value: string) => void
  onCheck: () => void
}

const EXAMPLE = '1장 서론\n1.1 운영체제가 하는 일\n1.2 컴퓨터 시스템의 구성\n2장 운영체제 구조'

/** Contents for an edition YES24 lists none for, shown as they will read before the book is imported. */
export function PastedContents({ value, outline, busy, onChange, onCheck }: Props) {
  return (
    <div className="afield">
      <label className="afield">
        <span className="mono">Contents</span>
        <textarea
          className="ainput bpaste"
          name="contents"
          rows={5}
          required
          maxLength={50_000}
          spellCheck={false}
          placeholder={EXAMPLE}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
      <div className="bcheck">
        <button className="pill" type="button" disabled={busy || !value.trim()} onClick={onCheck}>
          Check
        </button>
        {outline && <span className="mono bcheck__meta">{contentsMeta(outline)}</span>}
      </div>
      {outline && (
        <ol className="boutline">
          {outline.chapters.map((chapter) => (
            <li key={chapter.number}>
              <span className="mono">{chapter.number}</span> {chapter.title}
              <ol>
                {chapter.sections.map((section) => (
                  <li key={section.number}>
                    <span className="mono">{section.number}</span> {section.title}
                  </li>
                ))}
              </ol>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
