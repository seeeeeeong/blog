package blog.book.dto.response

import blog.book.entity.BookSection
import blog.post.dto.response.AdminPostSummaryResponse
import java.util.UUID

/** A chapter with its [sections], or a section with none; [post] is the one written for it, drafts too. */
data class AdminBookSectionResponse(
    val id: UUID,
    val number: String,
    val title: String,
    val post: AdminPostSummaryResponse?,
    val sections: List<AdminBookSectionResponse>,
) {
    companion object {
        fun treeOf(
            sections: List<BookSection>,
            posts: Map<UUID, AdminPostSummaryResponse>,
        ): List<AdminBookSectionResponse> {
            val children = sections.groupBy { it.parentId }.mapValues { (_, list) -> list.sortedBy { it.position } }

            fun nodeOf(section: BookSection): AdminBookSectionResponse =
                AdminBookSectionResponse(
                    id = section.id,
                    number = section.number,
                    title = section.title,
                    post = posts[section.id],
                    sections = children[section.id].orEmpty().map(::nodeOf),
                )
            return children[null].orEmpty().map(::nodeOf)
        }
    }
}
