package blog.domain.post.dto.response

import blog.domain.post.entity.Post
import java.util.UUID

/** A published post as material for another feature, Ask, which answers from its body. */
data class PostSourceResponse(
    val id: UUID,
    val slug: String,
    val title: String,
    val bodyMdx: String,
) {
    companion object {
        fun from(post: Post) =
            PostSourceResponse(id = post.id, slug = post.slug, title = post.title, bodyMdx = post.bodyMdx)
    }
}
