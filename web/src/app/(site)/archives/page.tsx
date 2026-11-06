import type { Metadata } from 'next'
import { loadArchive } from '@/features/posts/api/archive'
import { Archive } from '@/features/posts/views/Archive'

export const metadata: Metadata = { title: 'Archives' }

export default async function ArchivesPage() {
  return <Archive archive={await loadArchive()} />
}
