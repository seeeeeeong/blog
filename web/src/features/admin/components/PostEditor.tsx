'use client'

import { type ReactNode, useRef, useState } from 'react'
import type { AdminPost, Topic } from '@/features/admin/api/types'
import { EditorBar, type EditorMode } from '@/features/admin/components/EditorBar'
import { MemoDialog } from '@/features/admin/components/MemoDialog'
import { MetaFields } from '@/features/admin/components/MetaFields'
import { PageHead } from '@/features/admin/components/PageHead'
import { PublishDialog } from '@/features/admin/components/PublishDialog'
import { RewriteDialog } from '@/features/admin/components/RewriteDialog'
import { Toast } from '@/features/admin/components/Toast'
import { useEditor } from '@/features/admin/hooks/useEditor'
import { useUnsavedWarning } from '@/features/admin/hooks/useUnsavedWarning'
import { editorMeta } from '@/features/admin/utils/editor'
import { type SelectionRange, selectionIn } from '@/features/admin/utils/selection'

/** Renders MDX through the reader's pipeline on the server, so the preview is the post. */
export type PreviewAction = (source: string) => Promise<ReactNode>

type Props = {
  post: AdminPost
  topics: readonly Topic[]
  previewAction: PreviewAction
}

const PREVIEW_FAILED = <p className="empty">미리보기를 만들지 못했습니다.</p>

export function PostEditor({ post, topics, previewAction }: Props) {
  const editor = useEditor(post)
  const { state, dirty, busy } = editor
  const published = state.post.status === 'PUBLISHED'
  const [mode, setMode] = useState<EditorMode>('write')
  const [preview, setPreview] = useState<ReactNode>(null)
  const [confirming, setConfirming] = useState(false)
  const [drafting, setDrafting] = useState(false)
  const [rewriting, setRewriting] = useState<SelectionRange | null>(null)
  const textarea = useRef<HTMLTextAreaElement>(null)
  const previews = useRef(0)
  useUnsavedWarning(dirty)

  // Only the newest preview lands, should an older one answer late.
  const switchTo = (next: EditorMode) => {
    setMode(next)
    if (next !== 'preview') return
    const request = ++previews.current
    const land = (node: ReactNode) => request === previews.current && setPreview(node)
    setPreview(null)
    void previewAction(state.draft.bodyMdx).then(land, () => land(PREVIEW_FAILED))
  }

  // The draft goes in as an edit, so autosave keeps it like any other.
  const applyDraft = (bodyMdx: string) => {
    setDrafting(false)
    setMode('write')
    editor.edit({ bodyMdx })
    editor.show('다듬은 글을 적용했습니다')
  }

  const applyRewrite = (bodyMdx: string) => {
    editor.edit({ bodyMdx })
    editor.show('선택한 부분을 바꿨습니다')
  }

  const openRewrite = () => {
    const box = textarea.current
    const range = box && selectionIn(state.draft.bodyMdx, box.selectionStart, box.selectionEnd)
    if (mode === 'write' && range) setRewriting(range)
    else editor.show('다시 쓸 부분을 Write 에서 먼저 선택해 주세요')
  }

  const confirmPublish = () => {
    setConfirming(false)
    void editor.publish()
  }

  return (
    <>
      <main className="apage apage--editor">
        <PageHead
          title={
            <input
              className="etitle"
              aria-label="제목"
              value={state.draft.title}
              maxLength={200}
              spellCheck={false}
              onChange={(event) => editor.edit({ title: event.target.value })}
            />
          }
          meta={editorMeta(state, topics)}
        />
        <MetaFields draft={state.draft} topics={topics} onEdit={editor.edit} />
        <textarea
          ref={textarea}
          className="mdx ebody"
          aria-label="본문 MDX"
          spellCheck={false}
          hidden={mode !== 'write'}
          value={state.draft.bodyMdx}
          onChange={(event) => editor.edit({ bodyMdx: event.target.value })}
        />
        {mode === 'preview' && <div className="prose epreview">{preview}</div>}
      </main>
      <EditorBar
        mode={mode}
        onMode={switchTo}
        published={published}
        dirty={dirty}
        busy={busy}
        savedAt={editor.savedAt}
        onSave={() => void editor.save()}
        onPublish={() => setConfirming(true)}
        onMemo={() => setDrafting(true)}
        onRewrite={openRewrite}
      />
      {!published && (
        <MemoDialog
          open={drafting}
          postId={state.post.id}
          body={state.draft.bodyMdx}
          onApply={applyDraft}
          onClose={() => setDrafting(false)}
        />
      )}
      {!published && (
        <RewriteDialog
          postId={state.post.id}
          body={state.draft.bodyMdx}
          range={rewriting}
          onApply={applyRewrite}
          onClose={() => setRewriting(null)}
        />
      )}
      <PublishDialog
        open={confirming}
        republish={published}
        onCancel={() => setConfirming(false)}
        onConfirm={confirmPublish}
      />
      <Toast notice={editor.notice} />
    </>
  )
}
