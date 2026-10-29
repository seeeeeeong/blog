import '@/features/posts/views/post.css'
import '@/features/books/views/books.css'
import { previewMdx } from '@/app/admin/_components/preview'
import { NoteView } from '@/features/admin/views/NoteView'

// The note wears the post page's prose, and the back link the reader's book page's.
export default async function AdminNotePage({
  params,
}: PageProps<'/admin/books/[id]/sections/[sectionId]'>) {
  const { id, sectionId } = await params
  return <NoteView bookId={id} sectionId={sectionId} previewAction={previewMdx} />
}
