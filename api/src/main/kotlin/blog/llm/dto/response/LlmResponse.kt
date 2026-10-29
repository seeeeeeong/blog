package blog.llm.dto.response

/** A finished answer, and what it took. */
data class LlmResponse(
    val text: String,
    val model: String,
    val inputTokens: Int,
    val outputTokens: Int,
)
