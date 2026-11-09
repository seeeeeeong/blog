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
  NOT_RENDERABLE: '렌더링되지 않을 수 있음',
  HEADING_DEPTH: '### 이하 제목',
  SECTION_COUNT: '섹션 수가 3~5개가 아님',
  NO_CLOSING: '마지막이 마무리가 아님',
  NO_OPENING_QUESTION: '도입에 질문이 없음',
  NO_FIGURE: '그림이 없는 섹션',
  TRY_STEPS: '해 볼 단계가 1~3개가 아님',
  STEPS_WITHOUT_WIDGET: '보이지 않는 그림에 단계',
  LINK_UNKNOWN: '발행되지 않은 글로 링크',
  MEMO_CODE_CHANGED: '메모의 코드가 바뀜',
  MEMO_NUMBER_MISSING: '메모의 숫자가 빠짐',
  LINK_ADDED: '메모에 없는 링크',
  LENGTH: '본문 길이',
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

const PREVIEW = 60

/** A kept draft's memo in a line: its first words, cut short. */
export function memoPreview(memo: string): string {
  const line = memo.trim().split('\n')[0]?.trim() ?? ''
  return line.length > PREVIEW ? `${line.slice(0, PREVIEW)}…` : line
}

export function memoStep(state: StreamState<PostDraft>): MemoStep {
  if (state.state === 'streaming') return 'streaming'
  if (state.state === 'done') return 'confirm'
  return 'memo'
}

/** What the dialog shows: a draft opened again from the kept ones stands in for a finished run. */
export function memoShown(state: StreamState<PostDraft>, reopened: PostDraft | null) {
  const view = memoView(state)
  if (!reopened) return { ...view, step: memoStep(state) }
  return { ...view, draft: view.draft ?? reopened, step: 'confirm' as MemoStep }
}
