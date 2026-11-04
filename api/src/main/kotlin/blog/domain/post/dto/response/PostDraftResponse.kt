package blog.domain.post.dto.response

/** A draft of the post's body from the admin's memo, not saved: the editor puts it in the body. */
data class PostDraftResponse(
    val bodyMdx: String,
    val model: String,
    val inputTokens: Int,
    val outputTokens: Int,
)
