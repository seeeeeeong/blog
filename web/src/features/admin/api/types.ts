/** A topic as `GET /api/topics` lists it. */
export type Topic = {
  slug: string
  title: string
  /** The first part of each of its posts' numbers. */
  position: number
}

export type PostStatus = 'DRAFT' | 'PUBLISHED'

/** A post in `GET /api/admin/posts`, drafts included, newest change first. */
export type AdminPostSummary = {
  id: string
  slug: string
  title: string
  status: PostStatus
  topic: Topic
  /** `2.1`: the topic's position, then the post's within the topic. */
  number: string
  /** An ISO-8601 instant. */
  updatedAt: string
  /** An ISO-8601 instant; null for a draft never published. */
  publishedAt: string | null
}

/** A post as the editor loads it; [version] goes back with the next save. */
export type AdminPost = AdminPostSummary & {
  version: number
  position: number
  summary: string
  bodyMdx: string
  createdAt: string
}

/** What the editor sends to save a draft or to publish. */
export type PostSaveRequest = {
  version: number
  title: string
  slug: string
  topicSlug: string
  position: number
  summary: string
  bodyMdx: string
}

/** A new draft, last in its topic; without a slug the api makes one from the title. */
export type PostCreateRequest = {
  title: string
  topicSlug: string
  slug?: string
}

/** The signed-in admin, as `GET /api/admin/me` answers. */
export type Admin = {
  login: string
  name: string
  avatarUrl: string | null
}

/** What a separate call found comparing a draft with its memo. */
export type PostDraftReview = {
  addedFacts: { claim: string; quote: string; confidence: 'HIGH' | 'LOW' }[]
  corrections: { memo: string; draft: string; reason: string }[]
  invented: { quote: string; reason: string }[]
  dropped: string[]
  critical: { problem: string; quote: string; fix: string }[]
}

export type PostDraftCheckKind =
  | 'MEMO_CODE_CHANGED'
  | 'MEMO_NUMBER_MISSING'
  | 'LINK_ADDED'
  | 'NOT_RENDERABLE'

/** A body the model drafted from the admin's memo; nothing is saved until the editor saves it. */
export type PostDraft = {
  bodyMdx: string
  /** Null when the review could not be had, which is not the same as nothing to report. */
  review: PostDraftReview | null
  /** The model rewrote the draft once for what its first review called critical. */
  revised: boolean
  checks: { kind: PostDraftCheckKind; detail: string }[]
  model: string
  inputTokens: number
  outputTokens: number
}
