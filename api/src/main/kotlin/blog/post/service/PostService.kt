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

/** Posts as a reader sees them: published ones only, a draft is as good as missing. */
@Service
@Transactional(readOnly = true)
class PostService(
    private val postRepository: PostRepository,
    private val topicRepository: TopicRepository,
) {
    fun list(): List<PostSummaryResponse> {
        val posts = postRepository.findAllByStatusOrderByPublishedAtDescIdDesc(PostStatus.PUBLISHED)
        val topics = topicRepository.findAll().associateBy { it.id }
        return posts.map { PostSummaryResponse.from(it, topics.getValue(it.topicId)) }
    }

    fun get(slug: String): PostResponse {
        val post =
            postRepository.findBySlugAndStatus(slug, PostStatus.PUBLISHED)
                ?: throw BlogException(BlogError.POST_NOT_FOUND)
        val topic = checkNotNull(topicRepository.findByIdOrNull(post.topicId)) { "A post's topic is kept" }
        return PostResponse.from(post, topic)
    }
}
