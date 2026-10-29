package blog.domain.ask.dto.request

import blog.domain.ask.entity.AskPrompt
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.util.UUID

/**
 * A reader's question, on the post [postSlug] or, without one, on the home page. [history] is the
 * conversation so far as the reader's page holds it, of which only the latest turns are used;
 * [conversationId] is the one the first answer gave, which ties the turns together in the log.
 */
data class AskRequest(
    @field:Size(max = 100)
    val postSlug: String? = null,
    @field:NotBlank
    @field:Size(max = AskPrompt.MAX_QUESTION)
    val question: String,
    // The page keeps six turns; a few more are let through and trimmed, many are not read at all.
    @field:Valid
    @field:Size(max = 20)
    val history: List<AskTurnRequest> = emptyList(),
    val conversationId: UUID? = null,
)
