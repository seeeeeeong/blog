/** A streamed write: the text so far while the model writes, then its result or what went wrong. */
export type StreamState<T> =
  | { state: 'idle' }
  | { state: 'streaming'; text: string }
  | { state: 'done'; text: string; result: T }
  | { state: 'failed'; message: string }

export type StreamAction<T> =
  | { type: 'start' }
  | { type: 'text'; text: string }
  | { type: 'done'; result: T }
  | { type: 'fail'; message: string }
  | { type: 'reset' }

export const IDLE: StreamState<never> = { state: 'idle' }

// Only a stream in flight takes text, a result or a failure, so a late piece of one that was
// cancelled is dropped.
export function streamReducer<T>(state: StreamState<T>, action: StreamAction<T>): StreamState<T> {
  if (action.type === 'start') return { state: 'streaming', text: '' }
  if (action.type === 'reset') return IDLE
  if (state.state !== 'streaming') return state
  if (action.type === 'text') return { state: 'streaming', text: state.text + action.text }
  if (action.type === 'done') return { state: 'done', text: state.text, result: action.result }
  return { state: 'failed', message: action.message }
}
