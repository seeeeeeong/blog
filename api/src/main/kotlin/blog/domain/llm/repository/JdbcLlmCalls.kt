package blog.domain.llm.repository

import blog.domain.llm.entity.LlmCall
import blog.domain.llm.entity.LlmPurpose
import org.springframework.jdbc.core.simple.JdbcClient
import org.springframework.stereotype.Repository
import java.sql.Timestamp
import java.time.Instant

/** Append-only: a trigger refuses an update or a delete, and nothing here asks for one. */
@Repository
class JdbcLlmCalls(
    private val jdbcClient: JdbcClient,
) {
    fun append(call: LlmCall) {
        jdbcClient
            .sql(
                """
                insert into llm_call (id, purpose, model, input_tokens, output_tokens, cost_micros, created_at)
                values (:id, :purpose, :model, :inputTokens, :outputTokens, :costMicros, :createdAt)
                """.trimIndent(),
            ).param("id", call.id)
            .param("purpose", call.purpose.name)
            .param("model", call.model)
            .param("inputTokens", call.inputTokens)
            .param("outputTokens", call.outputTokens)
            .param("costMicros", call.costMicros)
            .param("createdAt", Timestamp.from(call.createdAt))
            .update()
    }

    /** Millionths of a dollar spent on [purposes] from [since] on. */
    fun spentSince(
        since: Instant,
        purposes: Collection<LlmPurpose>,
    ): Long =
        jdbcClient
            .sql(
                """
                select coalesce(sum(cost_micros), 0)
                from llm_call
                where created_at >= :since and purpose in (:purposes)
                """.trimIndent(),
            ).param("since", Timestamp.from(since))
            .param("purposes", purposes.map { it.name })
            .query(Long::class.java)
            .single()
}
