export type Topic = {
  slug: string
  title: string
  position: number
}

/** A section's published post, as the archive lists it. */
export type SectionPost = {
  slug: string
  title: string
  summary: string
  topic: Topic
  number: string
  /** An ISO-8601 instant. */
  publishedAt: string
}

/** A book in `GET /api/books`, newest first, with sections whose post is published of all it has. */
export type BookSummary = {
  id: string
  title: string
  authors: string | null
  publisher: string | null
  /** The book's YES24 page. */
  sourceUrl: string
  coverUrl: string | null
  topic: Topic | null
  writtenSections: number
  totalSections: number
}

/** A chapter with its [sections], or a section with none; [post] only once it is published. */
export type BookSection = {
  id: string
  number: string
  title: string
  post: SectionPost | null
  sections: BookSection[]
}

/** A book as `GET /api/books/{id}` answers it, with its contents. */
export type Book = BookSummary & {
  /** `2022-03-02`. */
  publishedOn: string | null
  chapters: BookSection[]
}
