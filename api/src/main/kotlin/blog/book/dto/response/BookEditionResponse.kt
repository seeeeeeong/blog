package blog.book.dto.response

import java.time.LocalDate

/**
 * An edition a search found, to pick from. [hasContents] says whether its contents read as chapters,
 * which an import needs; [imported] whether it is already a book here.
 */
data class BookEditionResponse(
    val sourceRef: String,
    val sourceUrl: String,
    val title: String,
    val authors: String?,
    val publisher: String?,
    val isbn13: String,
    val publishedOn: LocalDate?,
    val coverUrl: String?,
    val hasContents: Boolean,
    val imported: Boolean,
)
