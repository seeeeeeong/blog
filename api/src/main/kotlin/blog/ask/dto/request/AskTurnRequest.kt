package blog.ask.dto.request

import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size

/** One earlier turn: the reader's question (`user`) or the answer it got (`assistant`). */
data class AskTurnRequest(
    @field:Pattern(regexp = "user|assistant")
    val role: String,
    @field:Size(max = 10_000)
    val content: String,
) {
    val fromReader: Boolean get() = role == USER

    private companion object {
        const val USER = "user"
    }
}
