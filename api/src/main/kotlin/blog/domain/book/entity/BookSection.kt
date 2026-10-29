package blog.domain.book.entity

import blog.common.entity.BaseEntity
import blog.common.util.UuidV7
import jakarta.persistence.Entity
import org.hibernate.annotations.Immutable
import java.time.Instant
import java.util.UUID

/** A chapter of a book ([parentId] null) or one of its sections, imported with the book and never changed. */
@Entity
@Immutable
class BookSection(
    bookId: UUID,
    parentId: UUID?,
    number: String,
    title: String,
    position: Int,
    now: Instant,
) : BaseEntity(UuidV7.at(now)) {
    val bookId: UUID = bookId
    val parentId: UUID? = parentId
    val number: String = number
    val title: String = title
    val position: Int = position

    companion object {
        /** Each chapter before its sections, so a parent is stored first. */
        fun sectionsOf(
            book: Book,
            chapters: List<TocParser.Chapter>,
            now: Instant,
        ): List<BookSection> =
            chapters.withIndex().flatMap { (index, chapter) ->
                val stored =
                    BookSection(
                        bookId = book.id,
                        parentId = null,
                        number = chapter.number,
                        title = chapter.title,
                        position = index + 1,
                        now = now,
                    )
                val sections =
                    chapter.sections.withIndex().map { (at, section) ->
                        BookSection(
                            bookId = book.id,
                            parentId = stored.id,
                            number = section.number,
                            title = section.title,
                            position = at + 1,
                            now = now,
                        )
                    }
                listOf(stored) + sections
            }

        /** What gets a post of its own: a section, or a chapter that has none. */
        fun leavesOf(sections: List<BookSection>): List<BookSection> {
            val parents = sections.mapNotNull { it.parentId }.toSet()
            return sections.filter { it.id !in parents }
        }
    }
}
