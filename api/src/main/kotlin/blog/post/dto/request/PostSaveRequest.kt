package blog.post.dto.request

import blog.post.entity.SlugPolicy
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Positive
import jakarta.validation.constraints.Size

/**
 * The whole post as the editor holds it, saved as a draft or published. [version] is the one
 * the editor loaded; another save since then is a conflict, not an overwrite.
 */
data class PostSaveRequest(
    val version: Long,
    @field:NotBlank
    @field:Size(max = 200)
    val title: String,
    @field:Size(max = SlugPolicy.MAX_LENGTH)
    @field:Pattern(regexp = SlugPolicy.PATTERN)
    val slug: String,
    @field:NotBlank
    val topicSlug: String,
    @field:Positive
    val position: Int,
    @field:Size(max = 500)
    val summary: String,
    val bodyMdx: String,
)
