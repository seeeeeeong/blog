package blog.domain.post.entity

import blog.common.util.UuidV7
import java.time.Instant
import java.util.UUID

/** A draft the model wrote from a memo, and what its review said. Stored once, never changed. */
class PostGeneration(
    val postId: UUID,
    val memo: String,
    val written: Written,
    val usage: Usage,
    now: Instant,
) {
    /** The body that came back, what its review and the machine checks said, in JSON. */
    data class Written(
        val bodyMdx: String,
        val reviewJson: String?,
        val checksJson: String,
        val revised: Boolean,
    )

    data class Usage(
        val model: String,
        val inputTokens: Int,
        val outputTokens: Int,
    )

    val id: UUID = UuidV7.at(now)
    val createdAt: Instant = now
}
