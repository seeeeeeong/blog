package blog.post.dto.response

import blog.post.entity.Post
import blog.post.entity.PostStatus
import blog.post.entity.Topic
import java.time.Instant
import java.util.UUID

/** A post in the admin's list, drafts included, without its body. */
data class AdminPostSummaryResponse(
    val id: UUID,
    val slug: String,
    val title: String,
    val status: PostStatus,
    val topic: TopicResponse,
    val number: String,
    val updatedAt: Instant,
    val publishedAt: Instant?,
) {
    companion object {
        fun from(
            post: Post,
            topic: Topic,
        ) = AdminPostSummaryResponse(
            id = post.id,
            slug = post.slug,
            title = post.title,
            status = post.status,
            topic = TopicResponse.from(topic),
            number = post.numberIn(topic),
            updatedAt = post.updatedAt,
            publishedAt = post.publishedAt,
        )
    }
}
