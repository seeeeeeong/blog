package blog.domain.post.dto.request

import blog.domain.post.entity.PostRewritePrompt
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

/** A passage the admin selected in the body as the editor holds it, which may not be saved yet. */
data class PostRewriteRequest(
    @field:Size(max = PostRewritePrompt.MAX_CONTEXT)
    val before: String,
    @field:NotBlank
    @field:Size(max = PostRewritePrompt.MAX_SELECTED)
    val selected: String,
    @field:Size(max = PostRewritePrompt.MAX_CONTEXT)
    val after: String,
    @field:Size(max = PostRewritePrompt.MAX_INSTRUCTION)
    val instruction: String = "",
)
