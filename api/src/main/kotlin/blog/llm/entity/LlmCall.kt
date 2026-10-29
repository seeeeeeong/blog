package blog.llm.entity

import blog.common.util.UuidV7
import java.time.Instant
import java.util.UUID

/** One model call that answered, and its estimated cost. Stored once, never changed. */
class LlmCall(
    val purpose: LlmPurpose,
    val model: String,
    val inputTokens: Int,
    val outputTokens: Int,
    val costMicros: Long,
    now: Instant,
) {
    val id: UUID = UuidV7.at(now)
    val createdAt: Instant = now
}
