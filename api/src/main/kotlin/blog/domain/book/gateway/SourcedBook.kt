package blog.domain.book.gateway

import java.time.LocalDate

/**
 * An edition as the source describes it, each part cut to fit a book's columns. [contents] is one
 * item a line with the source's markup taken off, null when it has none.
 */
data class SourcedBook(
    val ref: String,
    val url: String,
    val title: String,
    val authors: String?,
    val publisher: String?,
    val isbn13: String,
    val publishedOn: LocalDate?,
    val coverUrl: String?,
    val contents: String?,
)
