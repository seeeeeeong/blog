package blog.domain.ask.repository

import blog.domain.ask.entity.AskMessage
import org.springframework.jdbc.core.simple.JdbcClient
import org.springframework.stereotype.Repository
import java.sql.Timestamp

/** Append-only: a trigger refuses an update or a delete, and nothing here asks for one. */
@Repository
class JdbcAskMessages(
    private val jdbcClient: JdbcClient,
) {
    fun append(message: AskMessage) {
        jdbcClient
            .sql(
                """
                insert into ask_message (id, conversation_id, post_id, role, content, grounded, created_at)
                values (:id, :conversationId, :postId, :role, :content, :grounded, :createdAt)
                """.trimIndent(),
            ).param("id", message.id)
            .param("conversationId", message.conversationId)
            .param("postId", message.postId)
            .param("role", message.role.name)
            .param("content", message.content)
            .param("grounded", message.grounded)
            .param("createdAt", Timestamp.from(message.createdAt))
            .update()
    }
}
