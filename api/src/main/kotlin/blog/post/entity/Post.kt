package blog.post.entity

import blog.common.entity.BaseEntity
import blog.common.util.UuidV7
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import org.hibernate.annotations.DynamicUpdate
import java.time.Instant
import java.util.UUID

/** One article, its body MDX. Only a published post is ever shown to a reader. */
@Entity
@DynamicUpdate
class Post(
    slug: String,
    title: String,
    topicId: UUID,
    position: Int,
    summary: String,
    bodyMdx: String,
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

    @Enumerated(EnumType.STRING)
    var status: PostStatus = PostStatus.DRAFT
        protected set
    var publishedAt: Instant? = null
        protected set
    var createdAt: Instant = now
        protected set
    var updatedAt: Instant = now
        protected set

    fun publish(now: Instant) {
        check(status == PostStatus.DRAFT) { "Only a draft is published" }
        status = PostStatus.PUBLISHED
        publishedAt = now
        updatedAt = now
    }

    /** `2.1`: the topic's place among topics, then the post's within the topic. */
    fun numberIn(topic: Topic): String {
        require(topic.id == topicId) { "Only the post's own topic numbers it" }
        return "${topic.position}.$position"
    }
}
