'use client'

import { useEffect, useState } from 'react'
import { Scramble } from '@/components/ui/Scramble'
import { useClock } from '@/hooks/useClock'
import { useWindowSize } from '@/hooks/useWindowSize'
import { type Brand, browserName } from '@/utils/browser'
import { commitOf, SOURCE_URL } from '@/utils/commit'
import { shortDate } from '@/utils/date'

type UserAgentData = { brands: readonly Brand[] }

// Inlined at build time; the build that ships sets it to the commit it was made from.
const COMMIT = commitOf(process.env.NEXT_PUBLIC_COMMIT_SHA)

function useBrowserName(): string {
  const [name, setName] = useState('')
  useEffect(() => {
    const data = (navigator as Navigator & { userAgentData?: UserAgentData }).userAgentData
    setName(browserName(navigator.userAgent, data?.brands))
  }, [])
  return name
}

function ExternalIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 4h6v6m0-6-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </svg>
  )
}

type ItemProps = { label: string; value: string; href?: string }

// A value known only in the browser is empty on the server; the space keeps its line.
function MetaItem({ label, value, href }: ItemProps) {
  const text = <Scramble text={value || ' '} />
  return (
    <div className="meta-item">
      <p>{label}</p>
      {href ? (
        <a className="meta-item__value mono" href={href} target="_blank" rel="noopener noreferrer">
          {text}
          <ExternalIcon />
        </a>
      ) : (
        <span className="meta-item__value mono">{text}</span>
      )}
    </div>
  )
}

/** The site's build and the reader's browser, as the footer's card shows them. */
export function FooterMetadata({ lastUpdated }: { lastUpdated?: string }) {
  const browser = useBrowserName()
  const time = useClock()
  const size = useWindowSize()
  return (
    <div className="meta-grid">
      <p className="meta-grid__title">Metadata</p>
      <MetaItem label="Commit" value={COMMIT.label} href={COMMIT.href} />
      <MetaItem label="Browser" value={browser} />
      <MetaItem label="Current Time" value={time} />
      <MetaItem label="Dimensions" value={size} />
      <MetaItem label="Source" value="blog" href={SOURCE_URL} />
      <MetaItem label="Last Updated" value={lastUpdated ? shortDate(lastUpdated) : 'N/A'} />
    </div>
  )
}
