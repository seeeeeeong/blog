import { type ReactNode, useId } from 'react'
import type { Topic } from '@/features/admin/api/types'
import { type SectionPlace, sectionHref } from '@/features/admin/utils/books'
import type { Draft } from '@/features/admin/utils/editor'

type Props = {
  draft: Draft
  topics: readonly Topic[]
  section: SectionPlace | null
  onEdit: (patch: Partial<Draft>) => void
}

type FieldProps = { id: string; label: string; wide?: boolean; children: ReactNode }

function Field({ id, label, wide, children }: FieldProps) {
  return (
    <div className={wide ? 'meta-item mfield mfield--wide' : 'meta-item mfield'}>
      <label className="mfield__label" htmlFor={id}>
        {label}
      </label>
      {children}
    </div>
  )
}

/** The post's metadata in the footer's card: where it lives, its place in the topic, its summary. */
export function MetaFields({ draft, topics, section, onEdit }: Props) {
  const id = useId()
  return (
    <div className="meta-card emeta">
      <div className="meta-grid">
        <p className="meta-grid__title">Metadata</p>
        <Field id={`${id}slug`} label="Slug">
          <input
            id={`${id}slug`}
            className="minput mono"
            value={draft.slug}
            spellCheck={false}
            autoComplete="off"
            onChange={(event) => onEdit({ slug: event.target.value })}
          />
        </Field>
        <Field id={`${id}topic`} label="Topic">
          <select
            id={`${id}topic`}
            className="minput"
            value={draft.topicSlug}
            onChange={(event) => onEdit({ topicSlug: event.target.value })}
          >
            {topics.map((topic) => (
              <option key={topic.slug} value={topic.slug}>
                {topic.title}
              </option>
            ))}
          </select>
        </Field>
        <Field id={`${id}order`} label="Order">
          <input
            id={`${id}order`}
            className="minput mono"
            type="number"
            min={1}
            value={draft.position}
            onChange={(event) => onEdit({ position: event.target.valueAsNumber || 0 })}
          />
        </Field>
        {section && (
          <div className="meta-item mfield mfield--wide">
            <p className="mfield__label">Book</p>
            <a className="mono mlink" href={sectionHref(section.book.id, section.section.id)}>
              {section.book.title} / {section.section.number}
            </a>
          </div>
        )}
        <Field id={`${id}summary`} label="Summary" wide>
          <textarea
            id={`${id}summary`}
            className="minput msummary"
            rows={2}
            maxLength={500}
            value={draft.summary}
            onChange={(event) => onEdit({ summary: event.target.value })}
          />
        </Field>
      </div>
    </div>
  )
}
