import '@/features/posts/views/post.css'
import { previewPost } from '@/app/admin/(console)/posts/[id]/_components/preview'
import { EditorView } from '@/features/admin/views/EditorView'

// The preview wears the post page's prose, so it reads as the post will.
export default async function AdminEditorPage({ params }: PageProps<'/admin/posts/[id]'>) {
  const { id } = await params
  return <EditorView id={id} previewAction={previewPost} />
}
