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

const STAGES = ['writing', 'reviewing', 'revising'] as const

const STAGE_LABELS: Record<(typeof STAGES)[number], string> = {
  writing: '글을 쓰는 중',
  reviewing: '메모와 대조해 검토하는 중',
  revising: '검토에서 나온 문제를 고치는 중',
}

/** Where a step sits on the progress; one the api adds later counts as the start. */
export function stageStep(stage: string | undefined): number {
  return Math.max(0, (STAGES as readonly (string | undefined)[]).indexOf(stage))
}

/** The step in words, for a screen reader only: the dialog shows no text while it waits. */
export function stageLabel(stage: string | undefined): string {
  return STAGE_LABELS[STAGES[stageStep(stage)] ?? 'writing']
}

/** What the dialog shows for a stream's state: where the run is, then the finished draft. */
export function memoView(state: StreamState<PostDraft>) {
  return {
    generating:
      state.state === 'streaming'
        ? { step: stageStep(state.stage), label: stageLabel(state.stage) }
        : null,
    draft: state.state === 'done' ? state.result : null,
    failure: state.state === 'failed' ? state.message : null,
  }
}

/** What stands in the way, if anything: a body changed since the draft, a memo too long, or a failure. */
export function memoProblem(memo: string, failure: string | null, stale: boolean): string | null {
  if (stale) return '그사이 본문이 바뀌었습니다. 다시 만들어 주세요.'
  if (memo.length > MEMO_MAX) {
    return `메모는 ${MEMO_MAX.toLocaleString('en-US')}자까지입니다. 지금 ${memo.length.toLocaleString('en-US')}자입니다.`
  }
  return failure
}

export function memoStep(state: StreamState<PostDraft>): MemoStep {
  if (state.state === 'streaming') return 'streaming'
  if (state.state === 'done') return 'confirm'
  return 'memo'
}
