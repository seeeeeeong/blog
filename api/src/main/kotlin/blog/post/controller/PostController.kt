package blog.post.controller

import blog.post.dto.response.PostResponse
import blog.post.dto.response.PostSummaryResponse
import blog.post.service.PostService
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/posts")
class PostController(
    private val postService: PostService,
) {
    @GetMapping
    fun list(): List<PostSummaryResponse> = postService.list()

    @GetMapping("/{slug}")
    fun get(
        @PathVariable slug: String,
    ): PostResponse = postService.get(slug)
}
