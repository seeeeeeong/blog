package blog.domain.post.entity

import blog.common.util.UuidV7
import java.time.Instant
import java.util.UUID

/** What one publish of [post] showed readers. Stored once, never changed. */
class PostRevision(
    post: Post,
    val number: Int,
    now: Instant,
) {
    init {
        require(post.status == PostStatus.PUBLISHED) { "Only a publish makes a revision" }
        require(number > 0) { "Revisions count from one" }
    }

    val id: UUID = UuidV7.at(now)
    val postId: UUID = post.id
    val content: PostContent = post.content
    val createdAt: Instant = now
}
