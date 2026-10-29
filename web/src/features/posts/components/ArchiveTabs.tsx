import type { ArchiveView } from '@/features/posts/utils/archive'

const TABS: { view: ArchiveView; label: string }[] = [
  { view: 'date', label: 'By date' },
  { view: 'topic', label: 'By topic' },
]

/** Plain fragment links: the browser switches the hash without a navigation, and says so. */
export function ArchiveTabs({ view }: { view: ArchiveView }) {
  return (
    <nav className="tabs" aria-label="보기 방식">
      {TABS.map((tab) => (
        <a
          key={tab.view}
          href={`#${tab.view}`}
          aria-current={tab.view === view ? 'page' : undefined}
        >
          {tab.label}
        </a>
      ))}
    </nav>
  )
}
