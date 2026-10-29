package blog.llm.gateway

/** The rules in [system], the material in [user], and the most the answer may run to. */
data class LlmChat(
    val system: String,
    val user: String,
    val maxTokens: Int,
)
