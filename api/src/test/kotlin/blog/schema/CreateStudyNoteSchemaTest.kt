package blog.schema

import blog.TestcontainersConfiguration
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.dao.DataAccessException
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.jdbc.core.simple.JdbcClient
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@SpringBootTest
@Import(TestcontainersConfiguration::class)
@Transactional
class CreateStudyNoteSchemaTest(
    @Autowired private val jdbc: JdbcClient,
) {
    private val sectionId = UUID.randomUUID()

    @BeforeEach
    fun section() {
        val bookId = UUID.randomUUID()
        jdbc
            .sql(
                """
                insert into book (id, version, title, isbn13, source_ref, source_url, created_at)
                values (:id, 0, '오브젝트', '9788998139766', '1', 'https://www.yes24.com/product/goods/1', now())
                """.trimIndent(),
            ).param("id", bookId)
            .update()
        jdbc
            .sql(
                """
                insert into book_section (id, version, book_id, parent_id, number, title, position)
                values (:id, 0, :bookId, null, '1', '객체, 설계', 1)
                """.trimIndent(),
            ).param("id", sectionId)
            .param("bookId", bookId)
            .update()
    }

    private fun note(
        section: UUID = sectionId,
        body: String = "## 책임\n\n객체는 책임을 가집니다.",
        outputTokens: Int = 1830,
    ): UUID {
        val id = UUID.randomUUID()
        jdbc
            .sql(
                """
                insert into study_note (id, section_id, body_mdx, model, input_tokens, output_tokens, created_at)
                values (:id, :sectionId, :body, 'deepseek-flash', 412, :outputTokens, now())
                """.trimIndent(),
            ).param("id", id)
            .param("sectionId", section)
            .param("body", body)
            .param("outputTokens", outputTokens)
            .update()
        return id
    }

    @Test
    fun `a section keeps every note written for it`() {
        note()
        note()

        val count =
            jdbc
                .sql("select count(*) from study_note where section_id = :sectionId")
                .param("sectionId", sectionId)
                .query(Int::class.java)
                .single()
        assertThat(count).isEqualTo(2)
    }

    @Test
    fun `a note is never changed`() {
        val id = note()

        assertThatThrownBy {
            jdbc.sql("update study_note set body_mdx = '고침' where id = :id").param("id", id).update()
        }.isInstanceOf(DataAccessException::class.java).hasMessageContaining("append-only")
    }

    @Test
    fun `a note is never deleted`() {
        val id = note()

        assertThatThrownBy {
            jdbc.sql("delete from study_note where id = :id").param("id", id).update()
        }.isInstanceOf(DataAccessException::class.java).hasMessageContaining("append-only")
    }

    @Test
    fun `a note belongs to a section that exists`() {
        assertThatThrownBy { note(section = UUID.randomUUID()) }
            .isInstanceOf(DataIntegrityViolationException::class.java)
    }

    @Test
    fun `a note has a body`() {
        assertThatThrownBy { note(body = "   ") }.isInstanceOf(DataIntegrityViolationException::class.java)
    }

    @Test
    fun `tokens are never negative`() {
        assertThatThrownBy { note(outputTokens = -1) }.isInstanceOf(DataIntegrityViolationException::class.java)
    }
}
