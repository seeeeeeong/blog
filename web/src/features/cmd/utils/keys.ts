import type { CmdMode } from '@/features/cmd/utils/items'

/** What a key pressed in the palette's input asks for; `stay` keeps focus in the dialog. */
export type CmdIntent = 'next' | 'previous' | 'run' | 'back' | 'close' | 'stay'

type KeyPress = { key: string; composing: boolean }

type MenuState = { mode: CmdMode; empty: boolean }

/** The intent of [key], or none for a key the input should simply type. */
export function intentOf(
  { key, composing }: KeyPress,
  { mode, empty }: MenuState,
): CmdIntent | undefined {
  // The IME owns every key while a Hangul syllable is still being composed.
  if (composing) return undefined
  switch (key) {
    case 'ArrowDown':
      return 'next'
    case 'ArrowUp':
      return 'previous'
    case 'Enter':
      return 'run'
    case 'Escape':
      return mode === 'posts' ? 'back' : 'close'
    case 'Backspace':
      return mode === 'posts' && empty ? 'back' : undefined
    case 'Tab':
      return 'stay'
    default:
      return undefined
  }
}

/** The item [step] places from [index] in a list of [length], wrapping at both ends. */
export function wrapIndex(index: number, step: number, length: number): number {
  if (length === 0) return 0
  return (((index + step) % length) + length) % length
}

type Shortcut = { key: string; code: string; metaKey: boolean; ctrlKey: boolean; altKey: boolean }

/** ⌘K or Ctrl+K. The physical key counts too, since a Hangul layout reports `ㅏ` for it. */
export function isCmdShortcut({ key, code, metaKey, ctrlKey, altKey }: Shortcut): boolean {
  return (metaKey || ctrlKey) && !altKey && (key.toLowerCase() === 'k' || code === 'KeyK')
}
