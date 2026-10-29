package blog.schema

import blog.TestcontainersConfiguration
import org.assertj.core.api.Assertions.assertThat
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
class CreateTopicAndPostSchemaTest(
    @Autowired private val jdbc: JdbcClient,
) {
    private val published = OffsetDateTime.of(2026, 10, 1, 0, 0, 0, 0, ZoneOffset.UTC)

    private fun topic(slug: String): UUID =
        jdbc
            .sql("select id from topic where slug = :slug")
            .param("slug", slug)
            .query(UUID::class.java)
            .single()

    private fun newTopic(
        slug: String,
        position: Int,
    ) = jdbc
        .sql(
            """
            insert into topic (id, version, slug, title, position, created_at)
            values (:id, 0, :slug, '주제', :position, now())
            """.trimIndent(),
        ).param("id", UUID.randomUUID())
        .param("slug", slug)
        .param("position", position)
        .update()

    private fun post(
        slug: String = "tcp-handshake",
        topic: UUID = topic("network"),
        position: Int = 1,
        status: String = "DRAFT",
        publishedAt: OffsetDateTime? = null,
        summary: String = "요약",
    ) = jdbc
        .sql(
            """
            insert into post (id, version, slug, title, topic_id, position, summary, body_mdx, status,
                              published_at, created_at, updated_at)
            values (:id, 0, :slug, '제목', :topic, :position, :summary, '# 본문', :status, :publishedAt, now(), now())
            """.trimIndent(),
        ).param("id", UUID.randomUUID())
        .param("slug", slug)
        .param("topic", topic)
        .param("position", position)
        .param("summary", summary)
        .param("status", status)
        .param("publishedAt", publishedAt)
        .update()

    private fun refused(call: () -> Unit) {
        assertThatThrownBy(call).isInstanceOf(DataIntegrityViolationException::class.java)
    }

    @Test
    fun `the five topics are seeded in their order`() {
        val topics =
            jdbc
                .sql("select slug, title from topic order by position")
                .query { rs, _ -> rs.getString("slug") to rs.getString("title") }
                .list()

        assertThat(topics).containsExactly(
            "os" to "운영체제",
            "network" to "네트워크",
            "database" to "데이터베이스",
            "algorithm" to "자료구조와 알고리즘",
            "spring" to "Spring",
        )
    }

    @Test
    fun `a topic's slug is its own`() {
        refused { newTopic(slug = "network", position = 6) }
    }

    @Test
    fun `a topic's position is its own`() {
        refused { newTopic(slug = "security", position = 2) }
    }

    @Test
    fun `a topic's slug is lowercase words joined by hyphens`() {
        refused { newTopic(slug = "Security", position = 6) }
    }

    @Test
    fun `a draft has no publish time, and a published post has one`() {
        assertThatCode {
            post(slug = "udp", position = 1)
            post(slug = "tcp", position = 2, status = "PUBLISHED", publishedAt = published)
        }.doesNotThrowAnyException()
    }

    @Test
    fun `a published post without a publish time is refused`() {
        refused { post(status = "PUBLISHED") }
    }

    @Test
    fun `a post is a draft or published, nothing else`() {
        refused { post(status = "ARCHIVED") }
    }

    @Test
    fun `a status is stored as the enum's name`() {
        refused { post(status = "draft") }
    }

    @Test
    fun `a post's slug is its own`() {
        post(slug = "tcp", position = 1)

        refused { post(slug = "tcp", position = 2) }
    }

    @Test
    fun `a post's slug is lowercase words joined by hyphens`() {
        refused { post(slug = "TCP IP") }
    }

    @Test
    fun `a position is taken once within a topic`() {
        post(slug = "tcp", position = 1)

        refused { post(slug = "udp", position = 1) }
    }

    @Test
    fun `the same position is free in another topic`() {
        post(slug = "tcp", position = 1)

        assertThatCode { post(slug = "process", topic = topic("os"), position = 1) }.doesNotThrowAnyException()
    }

    @Test
    fun `a position counts from one`() {
        refused { post(position = 0) }
    }

    @Test
    fun `a post is under a topic that exists`() {
        refused { post(topic = UUID.randomUUID()) }
    }

    @Test
    fun `a published post's summary is never empty`() {
        refused { post(summary = "", status = "PUBLISHED", publishedAt = published) }
    }
}
