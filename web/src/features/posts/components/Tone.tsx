import type { ReactNode } from 'react'

const COLORS = ['orange', 'teal', 'blue', 'pink'] as const

type Props = { color?: string; children?: ReactNode }

/** `<Tone color="orange">**SYN**</Tone>`: a term in the color a widget draws it in. */
export function Tone({ color, children }: Props) {
  const known = COLORS.find((name) => name === color)
  return <span className={known ? `tone tone--${known}` : 'tone'}>{children}</span>
}
