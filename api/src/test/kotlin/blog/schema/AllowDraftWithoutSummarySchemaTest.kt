package blog.schema

import blog.TestcontainersConfiguration
import org.assertj.core.api.Assertions.assertThatCode
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.jdbc.core.simple.JdbcClient
import org.springframework.transaction.annotation.Transactional
import java.time.OffsetDateTime
import java.time.ZoneOffset
import java.util.UUID

@SpringBootTest
@Import(TestcontainersConfiguration::class)
@Transactional
class AllowDraftWithoutSummarySchemaTest(
    @Autowired private val jdbc: JdbcClient,
) {
    private val published = OffsetDateTime.of(2026, 10, 1, 0, 0, 0, 0, ZoneOffset.UTC)

    private fun post(
        summary: String,
        status: String = "DRAFT",
        publishedAt: OffsetDateTime? = null,
    ) = jdbc
        .sql(
            """
            insert into post (id, version, slug, title, topic_id, position, summary, body_mdx, status,
                              published_at, created_at, updated_at)
            values (:id, 0, 'tcp', '제목', (select id from topic where slug = 'network'), 1, :summary, '',
                    :status, :publishedAt, now(), now())
            """.trimIndent(),
        ).param("id", UUID.randomUUID())
        .param("summary", summary)
        .param("status", status)
        .param("publishedAt", publishedAt)
        .update()

    @Test
    fun `a draft may have no summary yet`() {
        assertThatCode { post(summary = "") }.doesNotThrowAnyException()
    }

    @Test
    fun `a published post needs a summary`() {
        assertThatThrownBy { post(summary = "", status = "PUBLISHED", publishedAt = published) }
            .isInstanceOf(DataIntegrityViolationException::class.java)
    }

    @Test
    fun `a summary of spaces is no summary`() {
        assertThatThrownBy { post(summary = "   ", status = "PUBLISHED", publishedAt = published) }
            .isInstanceOf(DataIntegrityViolationException::class.java)
    }

    @Test
    fun `a summary stays within 500 characters, draft or not`() {
        assertThatThrownBy { post(summary = "가".repeat(501)) }.isInstanceOf(DataIntegrityViolationException::class.java)
    }
}
