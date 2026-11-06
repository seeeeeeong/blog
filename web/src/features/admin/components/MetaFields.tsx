import { type ReactNode, useId } from 'react'
import type { Topic } from '@/features/admin/api/types'
import type { Draft } from '@/features/admin/utils/editor'

type Props = {
  draft: Draft
  topics: readonly Topic[]
  onEdit: (patch: Partial<Draft>) => void
}

type FieldProps = { id: string; label: string; wide?: boolean; children: ReactNode }

function Field({ id, label, wide, children }: FieldProps) {
  return (
    <div className={wide ? 'mfield mfield--wide' : 'mfield'}>
      <label className="mfield__label" htmlFor={id}>
        {label}
      </label>
      {children}
    </div>
  )
}

/** The post's metadata: where it lives, its place in the topic, its summary. */
export function MetaFields({ draft, topics, onEdit }: Props) {
  const id = useId()
  return (
    <div className="emeta">
      <div className="emeta__grid">
        <Field id={`${id}slug`} label="Slug">
          <input
            id={`${id}slug`}
            className="minput minput--code"
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
            className="minput minput--code"
            type="number"
            min={1}
            value={draft.position}
            onChange={(event) => onEdit({ position: event.target.valueAsNumber || 0 })}
          />
        </Field>
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
