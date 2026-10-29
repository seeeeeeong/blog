package blog.post.dto.response

/**
 * A draft of the post's body from the admin's memo, not saved: the editor puts it in the body.
 * [usedNote] is whether the section's study note was given as reference.
 */
data class PostDraftResponse(
    val bodyMdx: String,
    val usedNote: Boolean,
    val model: String,
    val inputTokens: Int,
    val outputTokens: Int,
)
