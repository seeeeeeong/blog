export type AskIconName = 'minimize' | 'close' | 'send' | 'stop'

const PATHS: Record<AskIconName, string> = {
  minimize: 'M5 12h14',
  close: 'm6 6 12 12M18 6 6 18',
  send: 'M12 19V5m-6 6 6-6 6 6',
  stop: 'M8 8h8v8H8Z',
}

export function AskIcon({ name }: { name: AskIconName }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={name === 'stop' ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
