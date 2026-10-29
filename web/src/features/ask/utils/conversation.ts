import type { AskEvent, AskRequest, AskSource, AskTurn } from '@/features/ask/api/types'

// The api reads no more than the latest six turns.
export const MAX_TURNS = 6

export const MAX_QUESTION = 500

export type ExchangeStatus = 'waiting' | 'streaming' | 'done' | 'stopped' | 'failed'

/** A question and its answer as it streams in; [grounded] is false once it is known not to be. */
export type Exchange = {
  id: number
  question: string
  answer: string
  sources: AskSource[]
  grounded?: boolean
  status: ExchangeStatus
  error?: string
}

/** The questions asked on one page; another page starts a new one. */
export type Conversation = {
  path: string
  exchanges: Exchange[]
  conversationId?: string
  next: number
}

export type ConversationAction =
  | AskEvent
  | { type: 'ask'; question: string }
  | { type: 'fail'; message: string }
  | { type: 'stop' }
  | { type: 'reset'; path: string }

export function startConversation(path: string): Conversation {
  return { path, exchanges: [], next: 0 }
}

const inFlight = (exchange: Exchange | undefined) =>
  exchange?.status === 'waiting' || exchange?.status === 'streaming'

/** Whether an answer is still coming, so no other question can be asked. */
export const isAsking = (conversation: Conversation) => inFlight(conversation.exchanges.at(-1))

// An event that arrives with no answer in flight is from a stream already let go.
function updateLast(state: Conversation, change: (exchange: Exchange) => Exchange): Conversation {
  const last = state.exchanges.at(-1)
  if (!last || !inFlight(last)) return state
  return { ...state, exchanges: [...state.exchanges.slice(0, -1), change(last)] }
}

function ask(state: Conversation, question: string): Conversation {
  if (isAsking(state)) return state
  const exchange: Exchange = {
    id: state.next,
    question,
    answer: '',
    sources: [],
    status: 'waiting',
  }
  return { ...state, next: state.next + 1, exchanges: [...state.exchanges, exchange] }
}

function finish(state: Conversation, grounded: boolean, conversationId: string): Conversation {
  const next = updateLast(state, (exchange) => ({ ...exchange, status: 'done', grounded }))
  return next === state ? state : { ...next, conversationId }
}

export function converse(state: Conversation, action: ConversationAction): Conversation {
  switch (action.type) {
    case 'reset':
      return action.path === state.path ? state : startConversation(action.path)
    case 'ask':
      return ask(state, action.question)
    case 'sources':
      // An answer is grounded only in a post it names, so one with none is not.
      return updateLast(state, (exchange) => ({
        ...exchange,
        sources: action.posts,
        grounded: action.posts.length > 0 ? exchange.grounded : false,
      }))
    case 'text':
      return updateLast(state, (exchange) => ({
        ...exchange,
        answer: exchange.answer + action.text,
        status: 'streaming',
      }))
    case 'done':
      return finish(state, action.grounded, action.conversationId)
    case 'fail':
      return updateLast(state, (exchange) => ({
        ...exchange,
        status: 'failed',
        error: action.message,
      }))
    case 'stop':
      return updateLast(state, (exchange) => ({ ...exchange, status: 'stopped' }))
  }
}

/** The latest turns of the answers that finished, oldest first. */
export function historyOf(conversation: Conversation): AskTurn[] {
  return conversation.exchanges
    .filter((exchange) => exchange.status === 'done')
    .flatMap((exchange): AskTurn[] => [
      { role: 'user', content: exchange.question },
      { role: 'assistant', content: exchange.answer },
    ])
    .slice(-MAX_TURNS)
}

export function requestOf(
  conversation: Conversation,
  question: string,
  postSlug: string | undefined,
): AskRequest {
  const request: AskRequest = { question, history: historyOf(conversation) }
  if (postSlug) request.postSlug = postSlug
  if (conversation.conversationId) request.conversationId = conversation.conversationId
  return request
}

const POST_PATH = /^\/posts\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/

/** The post a page shows, which the question is about; none off a post's page. */
export function postSlugOf(pathname: string | null): string | undefined {
  return pathname?.match(POST_PATH)?.[1]
}

export const sourceHref = (source: AskSource) => `/posts/${encodeURIComponent(source.slug)}`
