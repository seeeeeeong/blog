import { type Progress, percentOf } from '@/utils/book'

export function ProgressBar({ progress }: { progress: Progress }) {
  return (
    <div
      className="bprogress"
      role="img"
      aria-label={`${progress.total}개 중 ${progress.written}개 정리`}
    >
      <span style={{ width: `${percentOf(progress)}%` }} />
    </div>
  )
}
