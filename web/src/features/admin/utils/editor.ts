import type { AdminPost, PostSaveRequest, Topic } from '@/features/admin/api/types'
import { shortDate } from '@/utils/date'

/** What the editor's fields hold. */
export type Draft = Omit<PostSaveRequest, 'version'>

/** [post] is the last version the api answered; [draft] is what the fields hold now. */
export type EditorState = { post: AdminPost; draft: Draft }

export type EditorAction =
  | { type: 'edit'; patch: Partial<Draft> }
  /** The api answered a save or a publish of [sent]. */
  | { type: 'saved'; post: AdminPost; sent: Draft }

const FIELDS = ['title', 'slug', 'topicSlug', 'position', 'summary', 'bodyMdx'] as const

export function draftOf(post: AdminPost): Draft {
  return {
    title: post.title,
    slug: post.slug,
    topicSlug: post.topic.slug,
    position: post.position,
    summary: post.summary,
    bodyMdx: post.bodyMdx,
  }
}

export function sameDraft(a: Draft, b: Draft): boolean {
  return FIELDS.every((field) => a[field] === b[field])
}

export function initialEditor(post: AdminPost): EditorState {
  return { post, draft: draftOf(post) }
}

// An edit made while a save was on its way stays in the fields and keeps them dirty.
export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  if (action.type === 'edit') return { ...state, draft: { ...state.draft, ...action.patch } }
  const draft = sameDraft(state.draft, action.sent) ? draftOf(action.post) : state.draft
  return { post: action.post, draft }
}

export function isDirty(state: EditorState): boolean {
  return !sameDraft(state.draft, draftOf(state.post))
}

/** The fields as they stand, with the version they were loaded at so a stale save is refused. */
export function saveRequest(state: EditorState): PostSaveRequest {
  return { version: state.post.version, ...state.draft }
}

/** `Draft / 2.1 network`, or `Published OCT 21 / 2.1 network`, after the fields as they stand. */
export function editorMeta(state: EditorState, topics: readonly Topic[]): string {
  const { post, draft } = state
  const topic = topics.find((t) => t.slug === draft.topicSlug) ?? post.topic
  const status =
    post.status === 'PUBLISHED' && post.publishedAt
      ? `Published ${shortDate(post.publishedAt)}`
      : 'Draft'
  return `${status} / ${topic.position}.${draft.position} ${topic.slug}`
}

/** What the editor is sending, if anything. */
export type Busy = 'save' | 'publish' | null

const clock = (at: Date) =>
  at.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })

/** The bar's word on the fields: `Saving…`, `Unsaved`, or `Saved 14:02` after a save here. */
export function saveLabel(dirty: boolean, busy: Busy, savedAt: Date | null): string {
  if (busy === 'save') return 'Saving…'
  if (busy === 'publish') return 'Publishing…'
  if (dirty) return 'Unsaved'
  return savedAt ? `Saved ${clock(savedAt)}` : 'Saved'
}
