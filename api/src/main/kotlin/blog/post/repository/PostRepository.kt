package blog.post.repository

import blog.post.entity.Post
import blog.post.entity.PostStatus
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.util.UUID

interface PostRepository : JpaRepository<Post, UUID> {
    fun findBySlugAndStatus(
        slug: String,
        status: PostStatus,
    ): Post?

    fun findAllByOrderByUpdatedAtDesc(): List<Post>

    fun existsBySlug(slug: String): Boolean

    fun existsBySlugAndIdNot(
        slug: String,
        id: UUID,
    ): Boolean

    fun existsByTopicIdAndPositionAndIdNot(
        topicId: UUID,
        position: Int,
        id: UUID,
    ): Boolean

    @Query("select coalesce(max(p.position), 0) + 1 from Post p where p.topicId = :topicId")
    fun nextPosition(topicId: UUID): Int

    // The id breaks a tie: it is a UUIDv7, so a later post sorts later.
    @Query(
        """
        select p from Post p
        where p.status = blog.post.entity.PostStatus.PUBLISHED
        order by p.publishedAt desc, p.id desc
        """,
    )
    fun findPublishedNewestFirst(): List<Post>

    @Query(
        """
        select p from Post p
        where p.topicId = :topicId and p.position < :position
          and p.status = blog.post.entity.PostStatus.PUBLISHED
        order by p.position desc
        limit 1
        """,
    )
    fun findPublishedBefore(
        topicId: UUID,
        position: Int,
    ): Post?

    @Query(
        """
        select p from Post p
        where p.topicId = :topicId and p.position > :position
          and p.status = blog.post.entity.PostStatus.PUBLISHED
        order by p.position asc
        limit 1
        """,
    )
    fun findPublishedAfter(
        topicId: UUID,
        position: Int,
    ): Post?
}
