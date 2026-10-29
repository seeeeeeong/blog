import type { Notice } from '@/features/admin/hooks/useNotice'

export function Toast({ notice }: { notice: Notice | null }) {
  if (!notice) return null
  return (
    <div
      className={notice.error ? 'toast toast--error' : 'toast'}
      role={notice.error ? 'alert' : 'status'}
    >
      {notice.text}
    </div>
  )
}
