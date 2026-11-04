/** A selection in the body, by character offsets. */
export type SelectionRange = { start: number; end: number }

/** The text selected and the text around it; all empty without a selection. */
export function partsOf(body: string, range: SelectionRange | null) {
  if (!range) return { before: '', selected: '', after: '' }
  return {
    before: body.slice(0, range.start),
    selected: body.slice(range.start, range.end),
    after: body.slice(range.end),
  }
}

/** The body with the selection replaced, by offset: the same words elsewhere stay as they are. */
export function replaced(body: string, range: SelectionRange, replacement: string): string {
  return body.slice(0, range.start) + replacement + body.slice(range.end)
}

/** The selection in a text box, or null when nothing but white space is selected. */
export function selectionIn(body: string, start: number, end: number): SelectionRange | null {
  return body.slice(start, end).trim() === '' ? null : { start, end }
}
