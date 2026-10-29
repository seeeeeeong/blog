/** How a save ended: a conflict means another save got there first, so saving again cannot help. */
export type SaveOutcome = 'saved' | 'conflict' | 'failed'

// Long enough that typing a sentence is one save, short enough that little is lost on a crash.
export const AUTOSAVE_DELAY_MS = 2000

export type Autosave = {
  /** A field changed: save once nothing has changed for the delay. */
  changed: () => void
  /** Save now, or once more after the save in flight; resolves when saving has settled. */
  flush: () => Promise<void>
  /** Drop a scheduled save and wait for the one in flight, as before a publish. */
  settle: () => Promise<void>
  /** No more saves on changes, after a conflict. */
  stop: () => void
  isStopped: () => boolean
  cancel: () => void
}

/**
 * Saves after a pause in editing, one request at a time: a change while a save is in flight
 * leads to one more save after it, never to two at once.
 */
export function createAutosave(
  save: () => Promise<SaveOutcome>,
  delay = AUTOSAVE_DELAY_MS,
): Autosave {
  let timer: ReturnType<typeof setTimeout> | undefined
  let running: Promise<void> | null = null
  let again = false
  let stopped = false

  const cancel = () => {
    clearTimeout(timer)
    timer = undefined
  }

  const loop = async () => {
    try {
      do {
        again = false
        if ((await save()) === 'conflict') stopped = true
      } while (again && !stopped)
    } finally {
      running = null
    }
  }

  const flush = () => {
    cancel()
    if (running) {
      again = true
      return running
    }
    running = loop()
    return running
  }

  return {
    changed: () => {
      if (stopped) return
      cancel()
      // A conflict may have come back while this waited.
      timer = setTimeout(() => {
        if (!stopped) void flush()
      }, delay)
    },
    flush,
    settle: () => {
      cancel()
      return running ?? Promise.resolve()
    },
    stop: () => {
      stopped = true
      cancel()
    },
    isStopped: () => stopped,
    cancel,
  }
}
