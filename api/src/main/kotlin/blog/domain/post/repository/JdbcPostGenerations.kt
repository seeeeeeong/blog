package blog.domain.post.repository

import blog.domain.post.entity.PostGeneration
import org.springframework.jdbc.core.simple.JdbcClient
import org.springframework.stereotype.Repository
import java.sql.Timestamp

/** Append-only: a trigger refuses an update or a delete, and nothing here asks for one. */
@Repository
class JdbcPostGenerations(
    private val jdbcClient: JdbcClient,
) {
    fun append(generation: PostGeneration) {
        jdbcClient
            .sql(
                """
                insert into post_generation (
                    id, post_id, memo, body_mdx, review, checks, revised, model, input_tokens, output_tokens, created_at
                ) values (
                    :id, :postId, :memo, :bodyMdx, cast(:review as jsonb), cast(:checks as jsonb), :revised, :model,
                    :inputTokens, :outputTokens, :createdAt
                )
                """.trimIndent(),
            ).param("id", generation.id)
            .param("postId", generation.postId)
            .param("memo", generation.memo)
            .param("bodyMdx", generation.written.bodyMdx)
            .param("review", generation.written.reviewJson)
            .param("checks", generation.written.checksJson)
            .param("revised", generation.written.revised)
            .param("model", generation.usage.model)
            .param("inputTokens", generation.usage.inputTokens)
            .param("outputTokens", generation.usage.outputTokens)
            .param("createdAt", Timestamp.from(generation.createdAt))
            .update()
    }
}
