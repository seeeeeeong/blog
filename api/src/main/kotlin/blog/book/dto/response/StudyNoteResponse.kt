package blog.book.dto.response

import blog.book.entity.StudyNote
import java.time.Instant
import java.util.UUID

/** A section's latest study note, for the admin alone. */
data class StudyNoteResponse(
    val id: UUID,
    val sectionId: UUID,
    val bodyMdx: String,
    val model: String,
    val inputTokens: Int,
    val outputTokens: Int,
    val createdAt: Instant,
) {
    companion object {
        fun from(note: StudyNote) =
            StudyNoteResponse(
                id = note.id,
                sectionId = note.sectionId,
                bodyMdx = note.bodyMdx,
                model = note.model,
                inputTokens = note.inputTokens,
                outputTokens = note.outputTokens,
                createdAt = note.createdAt,
            )
    }
}
