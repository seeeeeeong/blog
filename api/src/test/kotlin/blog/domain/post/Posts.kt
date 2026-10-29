package blog.domain.post

import blog.domain.post.entity.Post
import blog.domain.post.repository.PostRepository
import blog.domain.post.repository.TopicRepository
import java.time.Instant

/** Posts put straight into the store, skipping the admin's api and its revisions. */
class Posts(
    private val postRepository: PostRepository,
    private val topicRepository: TopicRepository,
) {
    fun draft(
        slug: String,
        topic: String = "network",
        position: Int = 1,
        at: Instant = Instant.parse("2026-10-01T00:00:00Z"),
    ): Post {
        val post = write(slug = slug, topic = topic, position = position, at = at)
        postRepository.save(post)
        return post
    }

    fun published(
        slug: String,
        topic: String = "network",
        position: Int = 1,
        at: Instant = Instant.parse("2026-10-01T00:00:00Z"),
    ): Post {
        val post = write(slug = slug, topic = topic, position = position, at = at)
        post.publish(post.content, at)
        postRepository.save(post)
        return post
    }

    fun clear() = postRepository.deleteAll()

    private fun write(
        slug: String,
        topic: String,
        position: Int,
        at: Instant,
    ): Post {
        val topicId = topicRepository.findAll().first { it.slug == topic }.id
        return Post(
            slug = slug,
            title = "제목 $slug",
            topicId = topicId,
            position = position,
            summary = "요약 $slug",
            bodyMdx = "# $slug\n\n본문이다.",
            sectionId = null,
            now = at,
        )
    }
}
