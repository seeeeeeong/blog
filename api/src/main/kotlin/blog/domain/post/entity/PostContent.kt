package blog.domain.post.entity

import java.util.UUID

/** Everything the admin writes in a post, saved as a draft or published at once. */
data class PostContent(
    val slug: String,
    val title: String,
    val topicId: UUID,
    val position: Int,
    val summary: String,
    val bodyMdx: String,
)
