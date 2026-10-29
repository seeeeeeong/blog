package blog.book.dto.response

import blog.book.entity.BookSection
import blog.post.dto.response.AdminPostSummaryResponse
import java.time.Instant
import java.util.UUID

/**
 * A chapter with its [sections], or a section with none; [post] is the one written for it, drafts
 * too, and [noteCreatedAt] when its latest study note was written, null without one.
 */
data class AdminBookSectionResponse(
    val id: UUID,
    val number: String,
    val title: String,
    val post: AdminPostSummaryResponse?,
    val noteCreatedAt: Instant?,
    val sections: List<AdminBookSectionResponse>,
) {
    companion object {
        fun treeOf(
            sections: List<BookSection>,
            posts: Map<UUID, AdminPostSummaryResponse>,
            notes: Map<UUID, Instant>,
        ): List<AdminBookSectionResponse> {
            val children = sections.groupBy { it.parentId }.mapValues { (_, list) -> list.sortedBy { it.position } }

            fun nodeOf(section: BookSection): AdminBookSectionResponse =
                AdminBookSectionResponse(
                    id = section.id,
                    number = section.number,
                    title = section.title,
                    post = posts[section.id],
                    noteCreatedAt = notes[section.id],
                    sections = children[section.id].orEmpty().map(::nodeOf),
                )
            return children[null].orEmpty().map(::nodeOf)
        }
    }
}
