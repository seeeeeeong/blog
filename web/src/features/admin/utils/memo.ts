import type { PostDraft } from '@/features/admin/api/types'
import type { StreamState } from '@/features/admin/utils/stream'

// The api's PostDraftPrompt.MAX_MEMO, which refuses a longer memo.
export const MEMO_MAX = 20_000

/** Where the From memo dialog is: writing the memo, watching the draft come, or replacing the body. */
export type MemoStep = 'memo' | 'streaming' | 'confirm'

export function canDraft(memo: string): boolean {
  return memo.trim() !== '' && memo.length <= MEMO_MAX
}

/** A body with text is replaced only once the admin says so; an empty one is just filled. */
export function asksBeforeReplacing(body: string): boolean {
  return body.trim() !== ''
}

export function memoStep(state: StreamState<PostDraft>): MemoStep {
  if (state.state === 'streaming') return 'streaming'
  if (state.state === 'done') return 'confirm'
  return 'memo'
}

/** The toast once the draft is in the body. */
export function draftNotice(draft: Pick<PostDraft, 'usedNote'>): string {
  return draft.usedNote ? '노트를 참고해 초안을 만들었습니다' : '초안을 만들었습니다'
}
