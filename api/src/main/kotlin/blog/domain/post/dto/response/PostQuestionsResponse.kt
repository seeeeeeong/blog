package blog.domain.post.dto.response

/** What the model would ask the owner before writing up the memo; empty when the memo gives enough. */
data class PostQuestionsResponse(
    val questions: List<String>,
    val model: String,
    val inputTokens: Int,
    val outputTokens: Int,
)
