package blog.post.entity

import blog.common.entity.BaseEntity
import blog.common.util.UuidV7
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import org.hibernate.annotations.DynamicUpdate
import java.time.Instant
import java.util.UUID

/**
 * One article, its body MDX. Only a published post is ever shown to a reader, and it changes
 * only by publishing again, so every version a reader saw is a revision.
 */
@Entity
@DynamicUpdate
class Post(
    slug: String,
    title: String,
    topicId: UUID,
    position: Int,
    summary: String,
    bodyMdx: String,
    sectionId: UUID?,
    now: Instant,
) : BaseEntity(UuidV7.at(now)) {
    var slug: String = slug
        protected set
    var title: String = title
        protected set
    var topicId: UUID = topicId
        protected set
    var position: Int = position
        protected set
    var summary: String = summary
        protected set
    var bodyMdx: String = bodyMdx
        protected set

    /** The book section this post was written for; a post keeps it for good. */
    var sectionId: UUID? = sectionId
        protected set

    @Enumerated(EnumType.STRING)
    var status: PostStatus = PostStatus.DRAFT
        protected set
    var publishedAt: Instant? = null
        protected set
    var createdAt: Instant = now
        protected set
    var updatedAt: Instant = now
        protected set

    val content: PostContent
        get() =
            PostContent(
                slug = slug,
                title = title,
                topicId = topicId,
                position = position,
                summary = summary,
                bodyMdx = bodyMdx,
            )

    fun saveDraft(
        content: PostContent,
        now: Instant,
    ) {
        check(status == PostStatus.DRAFT) { "A published post changes only by publishing it again" }
        write(content, now)
    }

    /** The first publish dates the post; a later one changes what readers see and keeps that date. */
    fun publish(
        content: PostContent,
        now: Instant,
    ) {
        require(content.summary.isNotBlank()) { "A published post has a summary" }
        write(content, now)
        status = PostStatus.PUBLISHED
        publishedAt = publishedAt ?: now
    }

    /** `2.1`: the topic's place among topics, then the post's within the topic. */
    fun numberIn(topic: Topic): String {
        require(topic.id == topicId) { "Only the post's own topic numbers it" }
        return "${topic.position}.$position"
    }

    private fun write(
        content: PostContent,
        now: Instant,
    ) {
        slug = content.slug
        title = content.title
        topicId = content.topicId
        position = content.position
        summary = content.summary
        bodyMdx = content.bodyMdx
        updatedAt = now
    }
}
