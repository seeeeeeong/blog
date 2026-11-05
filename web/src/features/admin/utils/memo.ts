import type { PostDraft, PostDraftCheckKind } from '@/features/admin/api/types'
import type { StreamState } from '@/features/admin/utils/stream'

// The api's PostDraftPrompt.MAX_MEMO, which refuses a longer memo.
export const MEMO_MAX = 20_000

/** Where the From memo dialog is: writing the memo, watching the draft come, or choosing what to apply. */
export type MemoStep = 'memo' | 'streaming' | 'confirm'

export function canDraft(memo: string): boolean {
  return memo.trim() !== '' && memo.length <= MEMO_MAX
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
  writing: '글을 쓰는 중입니다. 첫 글자까지 30초쯤 걸립니다',
  reviewing: '메모와 대조해 검토하는 중입니다. 1~2분 걸립니다',
  revising: '치명적 문제를 고치는 중입니다',
}

export function stageLabel(stage: string | undefined): string | null {
  return stage ? (STAGE_LABELS[stage] ?? null) : null
}

/** What the dialog shows for a stream's state: the text coming, the step it reached, the finished draft. */
export function memoView(state: StreamState<PostDraft>) {
  return {
    text: state.state === 'streaming' ? state.text : '',
    stage: state.state === 'streaming' ? stageLabel(state.stage) : null,
    draft: state.state === 'done' ? state.result : null,
    failure: state.state === 'failed' ? state.message : null,
  }
}

export function memoStep(state: StreamState<PostDraft>): MemoStep {
  if (state.state === 'streaming') return 'streaming'
  if (state.state === 'done') return 'confirm'
  return 'memo'
}
