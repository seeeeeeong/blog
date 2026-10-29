package blog.schema

import blog.TestcontainersConfiguration
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.jdbc.core.simple.JdbcClient
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@SpringBootTest
@Import(TestcontainersConfiguration::class)
@Transactional
class CreateBookSchemaTest(
    @Autowired private val jdbc: JdbcClient,
) {
    private fun book(
        sourceRef: String = "74219491",
        isbn13: String = "9788998139766",
        sourceUrl: String = "https://www.yes24.com/product/goods/$sourceRef",
    ): UUID {
        val id = UUID.randomUUID()
        jdbc
            .sql(
                """
                insert into book (id, version, title, isbn13, source_ref, source_url, topic_id, created_at)
                values (:id, 0, '오브젝트', :isbn13, :sourceRef, :sourceUrl, (select id from topic where slug = 'spring'),
                        now())
                """.trimIndent(),
            ).param("id", id)
            .param("isbn13", isbn13)
            .param("sourceRef", sourceRef)
            .param("sourceUrl", sourceUrl)
            .update()
        return id
    }

    private fun section(
        book: UUID,
        position: Int,
        parent: UUID? = null,
    ): UUID {
        val id = UUID.randomUUID()
        jdbc
            .sql(
                """
                insert into book_section (id, version, book_id, parent_id, number, title, position)
                values (:id, 0, :bookId, :parentId, '1', '객체, 설계', :position)
                """.trimIndent(),
            ).param("id", id)
            .param("bookId", book)
            .param("parentId", parent)
            .param("position", position)
            .update()
        return id
    }

    @Test
    fun `a book holds chapters and their sections`() {
        val book = book()
        val chapter = section(book, position = 1)
        section(book, position = 1, parent = chapter)
        section(book, position = 2, parent = chapter)

        val count =
            jdbc
                .sql(
                    "select count(*) from book_section where book_id = :id",
                ).param("id", book)
                .query(Int::class.java)

        assertThat(count.single()).isEqualTo(3)
    }

    @Test
    fun `an edition is imported once`() {
        book(sourceRef = "1")

        assertThatThrownBy { book(sourceRef = "1") }.isInstanceOf(DataIntegrityViolationException::class.java)
    }

    // A failed insert ends the transaction, so each test makes one.
    @Test
    fun `an isbn is thirteen digits`() {
        assertThatThrownBy {
            book(
                isbn13 = "978-89-98139-76-6",
            )
        }.isInstanceOf(DataIntegrityViolationException::class.java)
    }

    @Test
    fun `the book's page is linked over https`() {
        assertThatThrownBy { book(sourceUrl = "http://www.yes24.com/product/goods/1") }
            .isInstanceOf(DataIntegrityViolationException::class.java)
    }

    @Test
    fun `two chapters of a book do not share a position`() {
        val book = book()
        section(book, position = 1)

        assertThatThrownBy { section(book, position = 1) }.isInstanceOf(DataIntegrityViolationException::class.java)
    }

    @Test
    fun `two sections of a chapter do not share a position`() {
        val book = book()
        val chapter = section(book, position = 1)
        section(book, position = 1, parent = chapter)

        assertThatThrownBy { section(book, position = 1, parent = chapter) }
            .isInstanceOf(DataIntegrityViolationException::class.java)
    }

    @Test
    fun `a section's chapter is in the same book`() {
        val chapter = section(book(sourceRef = "1"), position = 1)
        val other = book(sourceRef = "2")

        assertThatThrownBy { section(other, position = 1, parent = chapter) }
            .isInstanceOf(DataIntegrityViolationException::class.java)
    }
}
