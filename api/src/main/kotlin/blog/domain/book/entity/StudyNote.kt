package blog.domain.book.entity

import blog.common.util.UuidV7
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.UUID

/** A section's private study note as the model wrote it. Stored once, never changed; the latest is the note. */
class StudyNote(
    val sectionId: UUID,
    val bodyMdx: String,
    val model: String,
    val inputTokens: Int,
    val outputTokens: Int,
    now: Instant,
    /** Given only when a stored note is read back. */
    val id: UUID = UuidV7.at(now),
) {
    // PostgreSQL keeps microseconds, so a note just written answers as it will be read back.
    val createdAt: Instant = now.truncatedTo(ChronoUnit.MICROS)
}
