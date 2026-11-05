package blog.domain.llm.gateway

/**
 * The [model] asked, whether it thinks before it answers, the rules in [system], the material in
 * [user], and the most the answer may run to, thinking included.
 */
data class LlmChat(
    val model: String,
    val thinking: Boolean,
    val system: String,
    val user: String,
    val maxTokens: Int,
)
