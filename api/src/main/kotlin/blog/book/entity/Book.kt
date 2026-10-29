package blog.book.entity

import blog.common.entity.BaseEntity
import blog.common.util.UuidV7
import jakarta.persistence.Entity
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

/** An edition the admin studies, as YES24 described it on import; [topicId] is where its posts go. */
@Entity
class Book(
    title: String,
    authors: String?,
    publisher: String?,
    isbn13: String,
    publishedOn: LocalDate?,
    sourceRef: String,
    sourceUrl: String,
    coverUrl: String?,
    topicId: UUID?,
    now: Instant,
) : BaseEntity(UuidV7.at(now)) {
    val title: String = title
    val authors: String? = authors
    val publisher: String? = publisher
    val isbn13: String = isbn13
    val publishedOn: LocalDate? = publishedOn
    val sourceRef: String = sourceRef
    val sourceUrl: String = sourceUrl
    val coverUrl: String? = coverUrl
    var topicId: UUID? = topicId
        protected set
    val createdAt: Instant = now

    fun placeIn(topicId: UUID?) {
        this.topicId = topicId
    }
}
