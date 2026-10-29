package blog.domain.book.repository

import blog.domain.book.entity.Book
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.util.UUID

interface BookRepository : JpaRepository<Book, UUID> {
    fun existsBySourceRef(sourceRef: String): Boolean

    fun findAllBySourceRefIn(sourceRefs: Collection<String>): List<Book>

    // The id breaks a tie: it is a UUIDv7, so a later book sorts later.
    @Query("select b from Book b order by b.createdAt desc, b.id desc")
    fun findNewestFirst(): List<Book>
}
