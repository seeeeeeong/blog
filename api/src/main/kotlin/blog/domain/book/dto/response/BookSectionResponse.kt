package blog.domain.book.dto.response

import blog.domain.book.entity.BookSection
import blog.domain.post.dto.response.PostSummaryResponse
import java.util.UUID

/** A chapter with its [sections], or a section with none; [post] only once it is published. */
data class BookSectionResponse(
    val id: UUID,
    val number: String,
    val title: String,
    val post: PostSummaryResponse?,
    val sections: List<BookSectionResponse>,
) {
    companion object {
        fun treeOf(
            sections: List<BookSection>,
            published: Map<UUID, PostSummaryResponse>,
        ): List<BookSectionResponse> {
            val children = sections.groupBy { it.parentId }.mapValues { (_, list) -> list.sortedBy { it.position } }

            fun nodeOf(section: BookSection): BookSectionResponse =
                BookSectionResponse(
                    id = section.id,
                    number = section.number,
                    title = section.title,
                    post = published[section.id],
                    sections = children[section.id].orEmpty().map(::nodeOf),
                )
            return children[null].orEmpty().map(::nodeOf)
        }
    }
}
