package blog.domain.post.dto.response

import java.time.Instant
import java.util.UUID

/** A draft the model wrote for the post earlier, with the memo it came from, to open again. */
data class PostGenerationResponse(
    val id: UUID,
    val memo: String,
    val createdAt: Instant,
    val draft: PostDraftResponse,
)
