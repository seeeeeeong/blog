/** A post an answer comes from. */
export type AskSource = { slug: string; title: string }

/** An earlier turn sent back with the next question. */
export type AskTurn = { role: 'user' | 'assistant'; content: string }

/** The body of `POST /api/ask`; a question off any post page goes without [postSlug]. */
export type AskRequest = {
  postSlug?: string
  question: string
  history: AskTurn[]
  conversationId?: string
}

/** What the answer's stream says, in order: its sources once, its text in pieces, then done. */
export type AskEvent =
  | { type: 'sources'; posts: AskSource[] }
  | { type: 'text'; text: string }
  | { type: 'done'; grounded: boolean; conversationId: string }
