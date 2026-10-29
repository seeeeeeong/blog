import type { PostFilter } from '@/features/admin/utils/list'

const FILTERS: { filter: PostFilter; label: string }[] = [
  { filter: 'all', label: 'All' },
  { filter: 'draft', label: 'Drafts' },
  { filter: 'published', label: 'Published' },
]

type Props = { filter: PostFilter; onChange: (filter: PostFilter) => void }

export function FilterTabs({ filter, onChange }: Props) {
  return (
    <nav className="tabs" aria-label="필터">
      {FILTERS.map((tab) => (
        <button
          key={tab.filter}
          type="button"
          aria-pressed={tab.filter === filter}
          onClick={() => onChange(tab.filter)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
