package blog.post.service

import blog.post.dto.response.TopicResponse
import blog.post.repository.TopicRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class TopicService(
    private val topicRepository: TopicRepository,
) {
    fun list(): List<TopicResponse> = topicRepository.findAllByOrderByPositionAsc().map(TopicResponse::from)
}
