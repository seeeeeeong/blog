import { describe, expect, it } from 'vitest'
import { intentOf, isCmdShortcut, wrapIndex } from '@/features/cmd/utils/keys'

const press = (key: string, composing = false) => ({ key, composing })

describe('intentOf', () => {
  it('moves with the arrows and runs with Enter', () => {
    const root = { mode: 'root', empty: true } as const

    expect(intentOf(press('ArrowDown'), root)).toBe('next')
    expect(intentOf(press('ArrowUp'), root)).toBe('previous')
    expect(intentOf(press('Enter'), root)).toBe('run')
  })

  it('closes from the root on Escape, but goes back from the post search', () => {
    expect(intentOf(press('Escape'), { mode: 'root', empty: true })).toBe('close')
    expect(intentOf(press('Escape'), { mode: 'posts', empty: false })).toBe('back')
  })

  it('goes back on Backspace only from an empty post search', () => {
    expect(intentOf(press('Backspace'), { mode: 'posts', empty: true })).toBe('back')
    expect(intentOf(press('Backspace'), { mode: 'posts', empty: false })).toBeUndefined()
    expect(intentOf(press('Backspace'), { mode: 'root', empty: true })).toBeUndefined()
  })

  it('keeps Tab in the dialog and leaves other keys to the input', () => {
    expect(intentOf(press('Tab'), { mode: 'root', empty: true })).toBe('stay')
    expect(intentOf(press('a'), { mode: 'root', empty: true })).toBeUndefined()
  })

  it('leaves every key to the IME while it composes', () => {
    for (const key of ['Enter', 'ArrowDown', 'Escape', 'Backspace'])
      expect(intentOf(press(key, true), { mode: 'posts', empty: true })).toBeUndefined()
  })
})

describe('wrapIndex', () => {
  it('steps within the list', () => {
    expect(wrapIndex(0, 1, 3)).toBe(1)
    expect(wrapIndex(2, -1, 3)).toBe(1)
  })

  it('wraps past either end', () => {
    expect(wrapIndex(2, 1, 3)).toBe(0)
    expect(wrapIndex(0, -1, 3)).toBe(2)
  })

  it('stays at the start of an empty list', () => {
    expect(wrapIndex(0, 1, 0)).toBe(0)
    expect(wrapIndex(0, -1, 0)).toBe(0)
  })
})

describe('isCmdShortcut', () => {
  const key = (overrides: Partial<Parameters<typeof isCmdShortcut>[0]>) => ({
    key: 'k',
    code: 'KeyK',
    metaKey: false,
    ctrlKey: false,
    altKey: false,
    ...overrides,
  })

  it('takes ⌘K and Ctrl+K', () => {
    expect(isCmdShortcut(key({ metaKey: true }))).toBe(true)
    expect(isCmdShortcut(key({ ctrlKey: true, key: 'K' }))).toBe(true)
  })

  it('takes the K key under a Hangul layout', () => {
    expect(isCmdShortcut(key({ metaKey: true, key: 'ㅏ' }))).toBe(true)
  })

  it('ignores K alone, other letters and Alt', () => {
    expect(isCmdShortcut(key({}))).toBe(false)
    expect(isCmdShortcut(key({ metaKey: true, key: 'j', code: 'KeyJ' }))).toBe(false)
    expect(isCmdShortcut(key({ metaKey: true, altKey: true }))).toBe(false)
  })
})
