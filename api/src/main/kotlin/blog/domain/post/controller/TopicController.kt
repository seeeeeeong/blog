package blog.domain.post.controller

import blog.domain.post.dto.response.TopicResponse
import blog.domain.post.service.TopicService
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/topics")
class TopicController(
    private val topicService: TopicService,
) {
    @GetMapping
    fun list(): List<TopicResponse> = topicService.list()
}
