package blog.domain.post.dto.response

import blog.domain.post.entity.PostDraftCheck

/**
 * A draft of the post's body from the admin's memo, not saved: the editor puts it in the body. A
 * [review] that could not be had is null, never an empty list, and [revised] says the model rewrote
 * the draft once for what its first review called critical. The tokens are every call's together.
 */
data class PostDraftResponse(
    val bodyMdx: String,
    val review: PostDraftReviewResponse?,
    val revised: Boolean,
    val checks: List<PostDraftCheck.Finding>,
    val model: String,
    val inputTokens: Int,
    val outputTokens: Int,
)
