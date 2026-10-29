package blog.domain.book.repository

import blog.domain.book.entity.BookSection
import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface BookSectionRepository : JpaRepository<BookSection, UUID> {
    fun findAllByBookId(bookId: UUID): List<BookSection>

    fun findAllByBookIdIn(bookIds: Collection<UUID>): List<BookSection>
}
