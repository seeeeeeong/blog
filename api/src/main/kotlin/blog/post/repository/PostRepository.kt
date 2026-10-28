package blog.post.repository

import blog.post.entity.Post
import blog.post.entity.PostStatus
import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface PostRepository : JpaRepository<Post, UUID> {
    fun findBySlugAndStatus(
        slug: String,
        status: PostStatus,
    ): Post?

    // The id breaks a tie: it is a UUIDv7, so a later post sorts later.
    fun findAllByStatusOrderByPublishedAtDescIdDesc(status: PostStatus): List<Post>
}
