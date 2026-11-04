import type { PostDraft, PostDraftCheckKind } from '@/features/admin/api/types'
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

const CHECK_LABELS: Record<PostDraftCheckKind, string> = {
  MEMO_CODE_CHANGED: '메모의 코드가 바뀜',
  MEMO_NUMBER_MISSING: '메모의 숫자가 빠짐',
  LINK_ADDED: '메모에 없는 링크',
  NOT_RENDERABLE: '렌더링되지 않을 수 있음',
}

export function checkLabel(kind: PostDraftCheckKind): string {
  return CHECK_LABELS[kind]
}

const STAGE_LABELS: Record<string, string> = {
  reviewing: '메모와 대조해 검토하는 중입니다',
  revising: '치명적 문제를 고치는 중입니다',
}

export function stageLabel(stage: string | undefined): string | null {
  return stage ? (STAGE_LABELS[stage] ?? null) : null
}

export function memoStep(state: StreamState<PostDraft>): MemoStep {
  if (state.state === 'streaming') return 'streaming'
  if (state.state === 'done') return 'confirm'
  return 'memo'
}
