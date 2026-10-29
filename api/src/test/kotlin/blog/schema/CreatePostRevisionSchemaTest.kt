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
class CreatePostRevisionSchemaTest(
    @Autowired private val jdbc: JdbcClient,
) {
    private val postId = UUID.randomUUID()

    @BeforeEach
    fun post() {
        jdbc
            .sql(
                """
                insert into post (id, version, slug, title, topic_id, position, summary, body_mdx, status,
                                  published_at, created_at, updated_at)
                values (:id, 0, 'tcp', '제목', (select id from topic where slug = 'network'), 1, '요약', '# 본문',
                        'PUBLISHED', now(), now(), now())
                """.trimIndent(),
            ).param("id", postId)
            .update()
    }

    private fun revision(
        number: Int,
        post: UUID = postId,
        summary: String = "요약",
    ): UUID {
        val id = UUID.randomUUID()
        jdbc
            .sql(
                """
                insert into post_revision (id, post_id, number, slug, title, topic_id, position, summary,
                                           body_mdx, created_at)
                values (:id, :postId, :number, 'tcp', '제목', (select id from topic where slug = 'network'), 1,
                        :summary, '# 본문', now())
                """.trimIndent(),
            ).param("id", id)
            .param("postId", post)
            .param("number", number)
            .param("summary", summary)
            .update()
        return id
    }

    @Test
    fun `revisions are appended, numbered per post`() {
        revision(number = 1)
        revision(number = 2)

        val numbers =
            jdbc
                .sql("select number from post_revision where post_id = :postId order by number")
                .param("postId", postId)
                .query(Int::class.java)
                .list()
        assertThat(numbers).containsExactly(1, 2)
    }

    @Test
    fun `a revision is never changed`() {
        val id = revision(number = 1)

        assertThatThrownBy {
            jdbc.sql("update post_revision set title = '고침' where id = :id").param("id", id).update()
        }.isInstanceOf(DataAccessException::class.java).hasMessageContaining("append-only")
    }

    @Test
    fun `a revision is never deleted`() {
        val id = revision(number = 1)

        assertThatThrownBy {
            jdbc.sql("delete from post_revision where id = :id").param("id", id).update()
        }.isInstanceOf(DataAccessException::class.java).hasMessageContaining("append-only")
    }

    @Test
    fun `a number is taken once per post`() {
        revision(number = 1)

        assertThatThrownBy { revision(number = 1) }.isInstanceOf(DataIntegrityViolationException::class.java)
    }

    @Test
    fun `numbers count from one`() {
        assertThatThrownBy { revision(number = 0) }.isInstanceOf(DataIntegrityViolationException::class.java)
    }

    @Test
    fun `a revision belongs to a post that exists`() {
        assertThatThrownBy { revision(number = 1, post = UUID.randomUUID()) }
            .isInstanceOf(DataIntegrityViolationException::class.java)
    }

    @Test
    fun `a revision was published, so it has a summary`() {
        assertThatThrownBy { revision(number = 1, summary = " ") }
            .isInstanceOf(DataIntegrityViolationException::class.java)
    }
}
