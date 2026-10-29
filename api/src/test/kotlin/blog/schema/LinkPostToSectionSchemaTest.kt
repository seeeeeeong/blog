package blog.schema

import blog.TestcontainersConfiguration
import org.assertj.core.api.Assertions.assertThatCode
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.BeforeEach
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
class LinkPostToSectionSchemaTest(
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

    private fun post(
        slug: String,
        position: Int,
        section: UUID?,
    ) = jdbc
        .sql(
            """
            insert into post (id, version, slug, title, topic_id, position, summary, body_mdx, status,
                              created_at, updated_at, section_id)
            values (:id, 0, :slug, '제목', (select id from topic where slug = 'spring'), :position, '', '', 'DRAFT',
                    now(), now(), :sectionId)
            """.trimIndent(),
        ).param("id", UUID.randomUUID())
        .param("slug", slug)
        .param("position", position)
        .param("sectionId", section)
        .update()

    @Test
    fun `a post may be written for a section, or for none`() {
        assertThatCode {
            post(slug = "ticket", position = 1, section = sectionId)
            post(slug = "free", position = 2, section = null)
            post(slug = "free-2", position = 3, section = null)
        }.doesNotThrowAnyException()
    }

    @Test
    fun `a section has one post at most`() {
        post(slug = "ticket", position = 1, section = sectionId)

        assertThatThrownBy { post(slug = "ticket-2", position = 2, section = sectionId) }
            .isInstanceOf(DataIntegrityViolationException::class.java)
    }

    @Test
    fun `a post's section exists`() {
        assertThatThrownBy { post(slug = "ticket", position = 1, section = UUID.randomUUID()) }
            .isInstanceOf(DataIntegrityViolationException::class.java)
    }
}
