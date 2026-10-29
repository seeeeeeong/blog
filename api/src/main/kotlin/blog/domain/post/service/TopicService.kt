package blog.domain.post.service

import blog.common.exception.BlogError
import blog.common.exception.BlogException
import blog.domain.post.dto.response.TopicResponse
import blog.domain.post.repository.TopicRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional(readOnly = true)
class TopicService(
    private val topicRepository: TopicRepository,
) {
    fun list(): List<TopicResponse> = topicRepository.findAllByOrderByPositionAsc().map(TopicResponse::from)

    /** For another feature that keeps a topic by its id. */
    fun idOf(slug: String): UUID =
        topicRepository.findBySlug(slug)?.id ?: throw BlogException(BlogError.POST_TOPIC_NOT_FOUND)

    fun listById(): Map<UUID, TopicResponse> = topicRepository.findAll().associate { it.id to TopicResponse.from(it) }
}
