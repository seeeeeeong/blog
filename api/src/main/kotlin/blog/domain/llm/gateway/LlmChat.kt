package blog.domain.llm.gateway

/** The [model] asked, the rules in [system], the material in [user], and the most the answer may run to. */
data class LlmChat(
    val model: String,
    val system: String,
    val user: String,
    val maxTokens: Int,
)
