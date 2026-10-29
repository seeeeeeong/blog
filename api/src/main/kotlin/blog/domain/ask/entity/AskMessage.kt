package blog.domain.ask.entity

import blog.common.util.UuidV7
import java.time.Instant
import java.util.UUID

/**
 * A reader's question, or the answer they were given, with nothing that names the reader. Stored
 * once, never changed. [grounded] is whether an answer came from the blog's posts; a question has none.
 */
class AskMessage(
    val conversationId: UUID,
    val postId: UUID?,
    val role: AskRole,
    val content: String,
    val grounded: Boolean?,
    now: Instant,
) {
    init {
        require((role == AskRole.ASSISTANT) == (grounded != null)) { "Only an answer is grounded or not" }
        require(content.isNotBlank()) { "A message says something" }
    }

    val id: UUID = UuidV7.at(now)
    val createdAt: Instant = now
}
