package blog.domain.post.dto.response

/** What the model wrote in place of a selected passage, not saved: the editor puts it in the body. */
data class PostRewriteResponse(
    val replacement: String,
    val model: String,
    val inputTokens: Int,
    val outputTokens: Int,
)
