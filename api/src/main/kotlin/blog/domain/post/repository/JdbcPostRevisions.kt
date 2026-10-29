package blog.domain.post.repository

import blog.domain.post.entity.PostRevision
import org.springframework.jdbc.core.simple.JdbcClient
import org.springframework.stereotype.Repository
import java.sql.Timestamp
import java.util.UUID

/** Append-only: a trigger refuses an update or a delete, and nothing here asks for one. */
@Repository
class JdbcPostRevisions(
    private val jdbcClient: JdbcClient,
) {
    fun nextNumber(postId: UUID): Int =
        jdbcClient
            .sql("select coalesce(max(number), 0) + 1 from post_revision where post_id = :postId")
            .param("postId", postId)
            .query(Int::class.java)
            .single()

    fun append(revision: PostRevision) {
        val content = revision.content
        jdbcClient
            .sql(
                """
                insert into post_revision (id, post_id, number, slug, title, topic_id, position, summary,
                                           body_mdx, created_at)
                values (:id, :postId, :number, :slug, :title, :topicId, :position, :summary, :bodyMdx, :createdAt)
                """.trimIndent(),
            ).param("id", revision.id)
            .param("postId", revision.postId)
            .param("number", revision.number)
            .param("slug", content.slug)
            .param("title", content.title)
            .param("topicId", content.topicId)
            .param("position", content.position)
            .param("summary", content.summary)
            .param("bodyMdx", content.bodyMdx)
            .param("createdAt", Timestamp.from(revision.createdAt))
            .update()
    }
}
