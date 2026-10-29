package blog.book.dto.response

import blog.book.entity.Book
import blog.book.entity.BookSection
import blog.post.dto.response.PostSummaryResponse
import blog.post.dto.response.TopicResponse
import java.time.LocalDate
import java.util.UUID

/** A book as the reader's page shows it: its contents, each section linked to its post once published. */
data class BookResponse(
    val id: UUID,
    val title: String,
    val authors: String?,
    val publisher: String?,
    val publishedOn: LocalDate?,
    val sourceUrl: String,
    val coverUrl: String?,
    val topic: TopicResponse?,
    val writtenSections: Int,
    val totalSections: Int,
    val chapters: List<BookSectionResponse>,
) {
    companion object {
        fun from(
            book: Book,
            topic: TopicResponse?,
            sections: List<BookSection>,
            published: Map<UUID, PostSummaryResponse>,
        ): BookResponse {
            val summary =
                BookSummaryResponse.from(
                    book = book,
                    topic = topic,
                    sections = sections,
                    published = published,
                )
            return BookResponse(
                id = book.id,
                title = book.title,
                authors = book.authors,
                publisher = book.publisher,
                publishedOn = book.publishedOn,
                sourceUrl = book.sourceUrl,
                coverUrl = book.coverUrl,
                topic = topic,
                writtenSections = summary.writtenSections,
                totalSections = summary.totalSections,
                chapters = BookSectionResponse.treeOf(sections, published),
            )
        }
    }
}
