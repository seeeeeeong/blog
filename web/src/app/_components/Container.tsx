import type { ReactNode } from 'react'

export function Container({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-screen-sm px-5">{children}</div>
}
