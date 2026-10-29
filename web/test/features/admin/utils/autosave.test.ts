import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  AUTOSAVE_DELAY_MS,
  createAutosave,
  type SaveOutcome,
} from '@/features/admin/utils/autosave'

/** A save the test answers by hand, so it can stay in flight while the editor keeps changing. */
function manualSave() {
  const answers: ((outcome: SaveOutcome) => void)[] = []
  const save = vi.fn(
    () =>
      new Promise<SaveOutcome>((resolve) => {
        answers.push(resolve)
      }),
  )
  const answer = async (outcome: SaveOutcome = 'saved') => {
    answers.shift()?.(outcome)
    await vi.advanceTimersByTimeAsync(0)
  }
  return { save, answer }
}

beforeEach(() => vi.useFakeTimers())

afterEach(() => vi.useRealTimers())

describe('createAutosave', () => {
  it('saves once, the delay after the last of several changes', async () => {
    const { save } = manualSave()
    const autosave = createAutosave(save)

    autosave.changed()
    await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS - 1)
    autosave.changed()
    await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS - 1)

    expect(save).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)

    expect(save).toHaveBeenCalledTimes(1)
  })

  it('never sends two at once: a change during a save leads to one more after it', async () => {
    const { save, answer } = manualSave()
    const autosave = createAutosave(save)

    autosave.changed()
    await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS)
    autosave.changed()
    await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS)
    autosave.changed()
    await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS)

    expect(save).toHaveBeenCalledTimes(1)

    await answer()

    expect(save).toHaveBeenCalledTimes(2)

    await answer()
    await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS * 3)

    expect(save).toHaveBeenCalledTimes(2)
  })

  it('stops saving on changes after a conflict', async () => {
    const { save, answer } = manualSave()
    const autosave = createAutosave(save)

    autosave.changed()
    await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS)
    autosave.changed()
    await answer('conflict')
    await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS * 3)
    autosave.changed()
    await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS * 3)

    expect(save).toHaveBeenCalledTimes(1)
    expect(autosave.isStopped()).toBe(true)
  })

  it('tries again on the next change after another failure', async () => {
    const { save, answer } = manualSave()
    const autosave = createAutosave(save)

    autosave.changed()
    await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS)
    await answer('failed')
    await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS * 3)

    expect(save).toHaveBeenCalledTimes(1)

    autosave.changed()
    await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS)

    expect(save).toHaveBeenCalledTimes(2)
    expect(autosave.isStopped()).toBe(false)
  })

  it('saves at once on flush, dropping the scheduled save', async () => {
    const { save, answer } = manualSave()
    const autosave = createAutosave(save)

    autosave.changed()
    const flushed = autosave.flush()

    expect(save).toHaveBeenCalledTimes(1)

    await answer()
    await flushed
    await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS * 3)

    expect(save).toHaveBeenCalledTimes(1)
  })

  it('waits for the save in flight and drops the scheduled one when settling', async () => {
    const { save, answer } = manualSave()
    const autosave = createAutosave(save)
    autosave.changed()
    await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS)
    autosave.changed()

    let settled = false
    const settling = autosave.settle().then(() => {
      settled = true
    })
    await vi.advanceTimersByTimeAsync(0)

    expect(settled).toBe(false)

    await answer()
    await settling
    await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS * 3)

    expect(settled).toBe(true)
    expect(save).toHaveBeenCalledTimes(1)
  })

  it('settles at once with nothing in flight', async () => {
    const { save } = manualSave()

    await createAutosave(save).settle()

    expect(save).not.toHaveBeenCalled()
  })
})
