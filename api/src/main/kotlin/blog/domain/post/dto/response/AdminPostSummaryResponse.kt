package blog.domain.post.dto.response

import blog.domain.post.entity.Post
import blog.domain.post.entity.PostStatus
import blog.domain.post.entity.Topic
import java.time.Instant
import java.util.UUID

/** A post in the admin's list, drafts included, without its body. */
data class AdminPostSummaryResponse(
    val id: UUID,
    val slug: String,
    val title: String,
    val status: PostStatus,
    val topic: TopicResponse,
    val sectionId: UUID?,
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
            sectionId = post.sectionId,
            number = post.numberIn(topic),
            updatedAt = post.updatedAt,
            publishedAt = post.publishedAt,
        )
    }
}
