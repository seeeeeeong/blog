package blog.schema

import blog.TestcontainersConfiguration
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
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
class CreatePostGenerationSchemaTest(
    @Autowired private val jdbc: JdbcClient,
) {
    private fun post(): UUID {
        val id = UUID.randomUUID()
        jdbc
            .sql(
                """
                insert into post (id, slug, title, status, topic_id, position, summary, body_mdx, version, created_at, updated_at)
                select :id, :slug, '제목', 'DRAFT', id, 1, '', '', 0, now(), now() from topic limit 1
                """.trimIndent(),
            ).param("id", id)
            .param("slug", "post-$id")
            .update()
        return id
    }

    private fun generation(
        postId: UUID,
        review: String? = "{}",
    ): UUID {
        val id = UUID.randomUUID()
        jdbc
            .sql(
                """
                insert into post_generation (
                    id, post_id, memo, body_mdx, review, checks, revised, model, input_tokens, output_tokens, created_at
                ) values (
                    :id, :postId, '메모', '본문', cast(:review as jsonb), '[]', false, 'm', 1, 1, now()
                )
                """.trimIndent(),
            ).param("id", id)
            .param("postId", postId)
            .param("review", review)
            .update()
        return id
    }

    @Test
    fun `a generation is kept for its post, with or without a review`() {
        val post = post()

        generation(post)
        generation(post, review = null)

        val kept =
            jdbc
                .sql("select count(*) from post_generation where post_id = :post")
                .param("post", post)
                .query(Int::class.java)
                .single()
        assertThat(kept).isEqualTo(2)
    }

    @Test
    fun `a generation needs a post that exists`() {
        assertThatThrownBy { generation(UUID.randomUUID()) }
            .isInstanceOf(DataIntegrityViolationException::class.java)
    }

    @Test
    fun `a generation is never changed or removed`() {
        val id = generation(post())

        assertThatThrownBy {
            jdbc.sql("update post_generation set memo = '다른 메모' where id = :id").param("id", id).update()
        }.isInstanceOf(DataAccessException::class.java)
        assertThatThrownBy {
            jdbc.sql("delete from post_generation where id = :id").param("id", id).update()
        }.isInstanceOf(DataAccessException::class.java)
    }
}
