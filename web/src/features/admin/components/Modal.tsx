'use client'

import { type ReactNode, useEffect, useRef } from 'react'

type Props = {
  open: boolean
  /** The small mono line above the title. */
  eyebrow: string
  title: string
  /** Escape, or the dialog closing by any way other than an action. */
  onClose: () => void
  wide?: boolean
  children: ReactNode
}

/** A native modal dialog, so focus stays inside it and Escape closes it. */
export function Modal({ open, eyebrow, title, onClose, wide = false, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog ref={ref} className={wide ? 'modal modal--wide' : 'modal'} onClose={onClose}>
      <p className="mono modal__eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {children}
    </dialog>
  )
}
