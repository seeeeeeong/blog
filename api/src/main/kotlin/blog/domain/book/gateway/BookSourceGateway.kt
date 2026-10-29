package blog.domain.book.gateway

/**
 * A catalogue of books outside the blog that knows, for some, their contents. A failure is a
 * `BlogException` with a `book.source_*` error.
 */
interface BookSourceGateway {
    /** The editions a title or a few words find, best match first. */
    fun search(query: String): List<SourcedBook>

    /** Null when the source has no such book. [ref] is a [SourcedBook.ref] a search gave. */
    fun find(ref: String): SourcedBook?
}
