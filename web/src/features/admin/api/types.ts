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
  /** The book section it was written for, if any. */
  sectionId: string | null
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

/** An edition `GET /api/admin/books/search` found; only one [hasContents] can be imported. */
export type BookEdition = {
  sourceRef: string
  sourceUrl: string
  title: string
  authors: string | null
  publisher: string | null
  isbn13: string
  /** `2022-03-02`. */
  publishedOn: string | null
  coverUrl: string | null
  hasContents: boolean
  imported: boolean
}

/** A chapter with its [sections], or a section with none; [post] is the one written for it. */
export type AdminBookSection = {
  id: string
  number: string
  title: string
  post: AdminPostSummary | null
  sections: AdminBookSection[]
}

/** A book with its contents, as the admin keeps it. */
export type AdminBook = {
  id: string
  title: string
  authors: string | null
  publisher: string | null
  isbn13: string
  publishedOn: string | null
  sourceRef: string
  sourceUrl: string
  coverUrl: string | null
  /** Where the posts written for its sections go; none can be written without one. */
  topic: Topic | null
  createdAt: string
  chapters: AdminBookSection[]
}

/** An edition to import, and the topic its posts go to if chosen yet. */
export type BookImportRequest = {
  sourceRef: string
  topicSlug?: string
}
