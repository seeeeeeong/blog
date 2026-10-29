package blog.post.dto.request

import blog.post.entity.PostDraftPrompt
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

/** The admin's rough memo, which the model turns into a draft of the post. */
data class PostDraftRequest(
    @field:NotBlank
    @field:Size(max = PostDraftPrompt.MAX_MEMO)
    val memo: String,
)
