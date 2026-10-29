package blog.post.dto.response

import blog.post.entity.Post
import blog.post.entity.PostStatus
import blog.post.entity.Topic
import java.time.Instant
import java.util.UUID

/** A post as the admin's editor loads it; [version] goes back with the next save. */
data class AdminPostResponse(
    val id: UUID,
    val version: Long,
    val slug: String,
    val title: String,
    val status: PostStatus,
    val topic: TopicResponse,
    val sectionId: UUID?,
    val position: Int,
    val number: String,
    val summary: String,
    val bodyMdx: String,
    val createdAt: Instant,
    val updatedAt: Instant,
    val publishedAt: Instant?,
) {
    companion object {
        fun from(
            post: Post,
            topic: Topic,
        ) = AdminPostResponse(
            id = post.id,
            version = checkNotNull(post.version) { "A stored post has a version" },
            slug = post.slug,
            title = post.title,
            status = post.status,
            topic = TopicResponse.from(topic),
            sectionId = post.sectionId,
            position = post.position,
            number = post.numberIn(topic),
            summary = post.summary,
            bodyMdx = post.bodyMdx,
            createdAt = post.createdAt,
            updatedAt = post.updatedAt,
            publishedAt = post.publishedAt,
        )
    }
}
