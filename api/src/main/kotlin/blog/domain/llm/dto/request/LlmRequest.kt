package blog.domain.llm.dto.request

/**
 * One question for the model: the rules in [system], the material in [user], which the rules call
 * data, and the most the answer may run to.
 */
data class LlmRequest(
    val purpose: Purpose,
    val system: String,
    val user: String,
    val maxTokens: Int,
) {
    enum class Purpose {
        NOTE,
        MEMO,
        ASK,
    }
}
