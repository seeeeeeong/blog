package blog.domain.ask.dto.response

import java.util.UUID

/**
 * The `done` event that ends an answer. [grounded] is false when it does not come from the blog's
 * posts, which the page shows apart; [conversationId] goes back with the reader's next question.
 */
data class AskDoneResponse(
    val grounded: Boolean,
    val conversationId: UUID,
)
