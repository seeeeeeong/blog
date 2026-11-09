import { type ReactNode, useId } from 'react'
import type { Topic } from '@/features/admin/api/types'
import { Icon } from '@/features/admin/components/Icon'
import type { Draft } from '@/features/admin/utils/editor'

type Props = {
  draft: Draft
  topics: readonly Topic[]
  onEdit: (patch: Partial<Draft>) => void
}

type RowProps = {
  id: string
  label: string
  icon: Parameters<typeof Icon>[0]['name']
  children: ReactNode
}

function Row({ id, label, icon, children }: RowProps) {
  return (
    <div className="eprop">
      <label className="eprop__name" htmlFor={id}>
        <Icon name={icon} />
        {label}
      </label>
      {children}
    </div>
  )
}

/** The post's metadata as rows under its title: where it lives, its place, its summary. */
export function MetaFields({ draft, topics, onEdit }: Props) {
  const id = useId()
  return (
    <div className="eprops">
      <Row id={`${id}slug`} label="Slug" icon="link">
        <input
          id={`${id}slug`}
          className="eprop__value eprop__value--code"
          value={draft.slug}
          spellCheck={false}
          autoComplete="off"
          onChange={(event) => onEdit({ slug: event.target.value })}
        />
      </Row>
      <Row id={`${id}topic`} label="Topic" icon="folder">
        <select
          id={`${id}topic`}
          className="eprop__value"
          value={draft.topicSlug}
          onChange={(event) => onEdit({ topicSlug: event.target.value })}
        >
          {topics.map((topic) => (
            <option key={topic.slug} value={topic.slug}>
              {topic.title}
            </option>
          ))}
        </select>
      </Row>
      <Row id={`${id}order`} label="Order" icon="order">
        <input
          id={`${id}order`}
          className="eprop__value"
          type="number"
          min={1}
          value={draft.position}
          onChange={(event) => onEdit({ position: event.target.valueAsNumber || 0 })}
        />
      </Row>
      <Row id={`${id}summary`} label="Summary" icon="summary">
        <textarea
          id={`${id}summary`}
          className="eprop__value"
          rows={1}
          maxLength={500}
          value={draft.summary}
          onChange={(event) => onEdit({ summary: event.target.value })}
        />
      </Row>
    </div>
  )
}
