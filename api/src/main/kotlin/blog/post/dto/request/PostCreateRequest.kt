package blog.post.dto.request

import blog.post.entity.SlugPolicy
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size

/** A new draft, last in its topic. Without a [slug], one is made from the title. */
data class PostCreateRequest(
    @field:NotBlank
    @field:Size(max = 200)
    val title: String,
    @field:NotBlank
    val topicSlug: String,
    @field:Size(max = SlugPolicy.MAX_LENGTH)
    @field:Pattern(regexp = SlugPolicy.PATTERN)
    val slug: String? = null,
)
