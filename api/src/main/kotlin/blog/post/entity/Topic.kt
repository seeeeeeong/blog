package blog.post.entity

import blog.common.entity.BaseEntity
import blog.common.util.UuidV7
import jakarta.persistence.Entity
import org.hibernate.annotations.Immutable
import java.time.Instant

/** A fixed group of posts, seeded and changed only by migration. */
@Entity
@Immutable
class Topic(
    slug: String,
    title: String,
    position: Int,
    now: Instant,
) : BaseEntity(UuidV7.at(now)) {
    val slug: String = slug
    val title: String = title
    val position: Int = position
    val createdAt: Instant = now
}
