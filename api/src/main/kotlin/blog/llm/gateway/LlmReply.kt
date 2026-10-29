package blog.llm.gateway

/** An answer as the model reported it; [finished] is false when it was cut off at the token limit. */
data class LlmReply(
    val text: String,
    val model: String,
    val inputTokens: Int,
    val outputTokens: Int,
    val finished: Boolean,
)
