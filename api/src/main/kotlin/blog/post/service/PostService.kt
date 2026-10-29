package blog.post.service

import blog.common.exception.BlogError
import blog.common.exception.BlogException
import blog.post.dto.response.PostResponse
import blog.post.dto.response.PostSummaryResponse
import blog.post.entity.PostStatus
import blog.post.repository.PostRepository
import blog.post.repository.TopicRepository
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

/** Posts as a reader sees them: published ones only, a draft is as good as missing. */
@Service
@Transactional(readOnly = true)
class PostService(
    private val postRepository: PostRepository,
    private val topicRepository: TopicRepository,
) {
    fun list(): List<PostSummaryResponse> {
        val posts = postRepository.findPublishedNewestFirst()
        val topics = topicRepository.findAll().associateBy { it.id }
        return posts.map { PostSummaryResponse.from(it, topics.getValue(it.topicId)) }
    }

    /** The published posts written for these book sections, by section; a draft is as good as missing. */
    fun listPublishedForSections(sectionIds: Collection<UUID>): Map<UUID, PostSummaryResponse> {
        if (sectionIds.isEmpty()) return emptyMap()
        val posts = postRepository.findAllBySectionIdIn(sectionIds).filter { it.status == PostStatus.PUBLISHED }
        val topics = topicRepository.findAll().associateBy { it.id }
        return posts.associate {
            checkNotNull(it.sectionId) to PostSummaryResponse.from(it, topics.getValue(it.topicId))
        }
    }

    /** The post and its published neighbours in its topic, which a reader pages through in order. */
    fun get(slug: String): PostResponse {
        val post =
            postRepository.findBySlugAndStatus(slug, PostStatus.PUBLISHED)
                ?: throw BlogException(BlogError.POST_NOT_FOUND)
        val topic = checkNotNull(topicRepository.findByIdOrNull(post.topicId)) { "A post's topic is kept" }
        val previous = postRepository.findPublishedBefore(post.topicId, post.position)
        val next = postRepository.findPublishedAfter(post.topicId, post.position)
        return PostResponse.from(
            post = post,
            topic = topic,
            previous = previous?.let { PostSummaryResponse.from(it, topic) },
            next = next?.let { PostSummaryResponse.from(it, topic) },
        )
    }
}
