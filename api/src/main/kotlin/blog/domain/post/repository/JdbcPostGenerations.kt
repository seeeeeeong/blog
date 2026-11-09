package blog.domain.post.repository

import blog.domain.post.entity.PostGeneration
import org.springframework.jdbc.core.simple.JdbcClient
import org.springframework.stereotype.Repository
import java.sql.Timestamp
import java.time.Instant
import java.util.UUID

/** Append-only: a trigger refuses an update or a delete, and nothing here asks for one. */
@Repository
class JdbcPostGenerations(
    private val jdbcClient: JdbcClient,
) {
    /** A kept generation as stored, its review and checks still JSON. */
    data class Kept(
        val id: UUID,
        val memo: String,
        val written: PostGeneration.Written,
        val usage: PostGeneration.Usage,
        val createdAt: Instant,
    )

    fun newestFor(
        postId: UUID,
        limit: Int,
    ): List<Kept> =
        jdbcClient
            .sql(
                """
                select id, memo, body_mdx, review::text as review, checks::text as checks, revised, model,
                       input_tokens, output_tokens, created_at
                from post_generation
                where post_id = :postId
                order by created_at desc
                limit :limit
                """.trimIndent(),
            ).param("postId", postId)
            .param("limit", limit)
            .query { rs, _ ->
                Kept(
                    id = rs.getObject("id", UUID::class.java),
                    memo = rs.getString("memo"),
                    written =
                        PostGeneration.Written(
                            bodyMdx = rs.getString("body_mdx"),
                            reviewJson = rs.getString("review"),
                            checksJson = rs.getString("checks"),
                            revised = rs.getBoolean("revised"),
                        ),
                    usage =
                        PostGeneration.Usage(
                            model = rs.getString("model"),
                            inputTokens = rs.getInt("input_tokens"),
                            outputTokens = rs.getInt("output_tokens"),
                        ),
                    createdAt = rs.getTimestamp("created_at").toInstant(),
                )
            }.list()

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
