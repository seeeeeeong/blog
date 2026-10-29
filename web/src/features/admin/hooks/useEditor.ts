'use client'

import { useEffect, useRef, useState } from 'react'
import { AdminApiError, messageOf } from '@/features/admin/api/client'
import { publishPost, savePost } from '@/features/admin/api/posts'
import type { AdminPost } from '@/features/admin/api/types'
import { useNotice } from '@/features/admin/hooks/useNotice'
import { createAutosave, type SaveOutcome } from '@/features/admin/utils/autosave'
import {
  type Busy,
  type Draft,
  type EditorAction,
  type EditorState,
  editorReducer,
  initialEditor,
  isDirty,
  saveRequest,
} from '@/features/admin/utils/editor'

const isConflict = (error: unknown) =>
  error instanceof AdminApiError && error.code === 'post.edit_conflict'

const isDraft = (state: EditorState) => state.post.status === 'DRAFT'

/**
 * The editor's fields against the last version the api answered, and the calls that send them.
 * A draft saves itself after a pause; a published post changes only by publishing again.
 */
export function useEditor(loaded: AdminPost) {
  // A save reads the fields and the version as they are when it goes out, not as they were
  // when it was scheduled, so the state lives in a ref and is mirrored for rendering.
  const latest = useRef(initialEditor(loaded))
  const [state, setState] = useState(latest.current)
  const [busy, setBusy] = useState<Busy>(null)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const { notice, show, clear } = useNotice()

  const current = () => latest.current

  const dispatch = (action: EditorAction) => {
    latest.current = editorReducer(current(), action)
    setState(latest.current)
  }

  const send = async (kind: Exclude<Busy, null>): Promise<SaveOutcome> => {
    const before = current()
    setBusy(kind)
    try {
      const call = kind === 'save' ? savePost : publishPost
      const post = await call(before.post.id, saveRequest(before))
      dispatch({ type: 'saved', post, sent: before.draft })
      setSavedAt(new Date())
      return 'saved'
    } catch (error) {
      show(messageOf(error), true)
      return isConflict(error) ? 'conflict' : 'failed'
    } finally {
      setBusy(null)
    }
  }

  const [autosave] = useState(() =>
    createAutosave(async () => {
      const now = current()
      if (!isDraft(now) || !isDirty(now)) return 'saved'
      return send('save')
    }),
  )

  useEffect(() => autosave.cancel, [autosave])

  const edit = (patch: Partial<Draft>) => {
    dispatch({ type: 'edit', patch })
    if (isDraft(current())) autosave.changed()
  }

  const save = () => {
    clear()
    return autosave.flush()
  }

  const publish = async () => {
    clear()
    await autosave.settle()
    const outcome = await send('publish')
    if (outcome === 'saved') show('발행했습니다')
    if (outcome === 'conflict') autosave.stop()
  }

  return { state, dirty: isDirty(state), busy, savedAt, notice, edit, save, publish }
}
