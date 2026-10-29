package blog.post.repository

import blog.post.entity.Topic
import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface TopicRepository : JpaRepository<Topic, UUID> {
    fun findAllByOrderByPositionAsc(): List<Topic>

    fun findBySlug(slug: String): Topic?
}
