package blog.domain.book.dto.response

import blog.domain.book.entity.Book
import blog.domain.book.entity.BookSection
import blog.domain.post.dto.response.PostSummaryResponse
import blog.domain.post.dto.response.TopicResponse
import java.util.UUID

/** A book in the reader's list with its progress: sections with a published post, of all it has. */
data class BookSummaryResponse(
    val id: UUID,
    val title: String,
    val authors: String?,
    val publisher: String?,
    val sourceUrl: String,
    val coverUrl: String?,
    val topic: TopicResponse?,
    val writtenSections: Int,
    val totalSections: Int,
) {
    companion object {
        fun from(
            book: Book,
            topic: TopicResponse?,
            sections: List<BookSection>,
            published: Map<UUID, PostSummaryResponse>,
        ): BookSummaryResponse {
            val leaves = BookSection.leavesOf(sections)
            return BookSummaryResponse(
                id = book.id,
                title = book.title,
                authors = book.authors,
                publisher = book.publisher,
                sourceUrl = book.sourceUrl,
                coverUrl = book.coverUrl,
                topic = topic,
                writtenSections = leaves.count { it.id in published },
                totalSections = leaves.size,
            )
        }
    }
}
