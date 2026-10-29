package blog.book.dto.response

import blog.book.entity.Book
import blog.post.dto.response.TopicResponse
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

/** A book as the admin sees it: its contents, the post written for each section, drafts too, and its notes. */
data class AdminBookResponse(
    val id: UUID,
    val title: String,
    val authors: String?,
    val publisher: String?,
    val isbn13: String,
    val publishedOn: LocalDate?,
    val sourceRef: String,
    val sourceUrl: String,
    val coverUrl: String?,
    val topic: TopicResponse?,
    val createdAt: Instant,
    val chapters: List<AdminBookSectionResponse>,
) {
    companion object {
        /** [chapters] as [AdminBookSectionResponse.treeOf] builds them. */
        fun from(
            book: Book,
            topic: TopicResponse?,
            chapters: List<AdminBookSectionResponse>,
        ) = AdminBookResponse(
            id = book.id,
            title = book.title,
            authors = book.authors,
            publisher = book.publisher,
            isbn13 = book.isbn13,
            publishedOn = book.publishedOn,
            sourceRef = book.sourceRef,
            sourceUrl = book.sourceUrl,
            coverUrl = book.coverUrl,
            topic = topic,
            createdAt = book.createdAt,
            chapters = chapters,
        )
    }
}
