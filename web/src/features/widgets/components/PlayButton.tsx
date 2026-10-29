type Props = { playing: boolean; onToggle: () => void }

export function PlayButton({ playing, onToggle }: Props) {
  return (
    <button
      className="play"
      type="button"
      aria-pressed={playing}
      aria-label={playing ? '일시정지' : '재생'}
      onClick={onToggle}
    >
      <svg
        className="play__icon play__icon--play"
        viewBox="0 0 16 16"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M5 3.2v9.6a.6.6 0 0 0 .92.5l7.4-4.8a.6.6 0 0 0 0-1l-7.4-4.8a.6.6 0 0 0-.92.5Z" />
      </svg>
      <svg
        className="play__icon play__icon--pause"
        viewBox="0 0 16 16"
        fill="currentColor"
        aria-hidden="true"
      >
        <rect x="4" y="3" width="2.8" height="10" rx="0.8" />
        <rect x="9.2" y="3" width="2.8" height="10" rx="0.8" />
      </svg>
    </button>
  )
}
