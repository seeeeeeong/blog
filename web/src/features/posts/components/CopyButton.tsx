'use client'

import { useState } from 'react'

/** Copies [code] as written, without the line numbers on the page. */
export function CopyButton({ code }: { code: string }) {
  const [label, setLabel] = useState('코드 복사')
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setLabel('복사됨')
    } catch {
      setLabel('복사 실패')
    }
  }
  return (
    <button className="code__copy" type="button" aria-label={label} onClick={() => void copy()}>
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        aria-hidden="true"
      >
        <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
        <path d="M10.5 3.5v-.5A1.5 1.5 0 0 0 9 1.5H3A1.5 1.5 0 0 0 1.5 3v6A1.5 1.5 0 0 0 3 10.5h.5" />
      </svg>
    </button>
  )
}
