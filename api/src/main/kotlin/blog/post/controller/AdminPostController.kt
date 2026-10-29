package blog.post.controller

import blog.post.dto.request.PostCreateRequest
import blog.post.dto.request.PostSaveRequest
import blog.post.dto.response.AdminPostResponse
import blog.post.dto.response.AdminPostSummaryResponse
import blog.post.service.AdminPostService
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

/** The admin's editor; `SecurityConfig` lets only the admin under `/api/admin/`. */
@RestController
@RequestMapping("/api/admin/posts")
class AdminPostController(
    private val adminPostService: AdminPostService,
) {
    @GetMapping
    fun list(): List<AdminPostSummaryResponse> = adminPostService.list()

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(
        @Valid @RequestBody request: PostCreateRequest,
    ): AdminPostResponse = adminPostService.create(request)

    @GetMapping("/{id}")
    fun get(
        @PathVariable id: UUID,
    ): AdminPostResponse = adminPostService.get(id)

    @PutMapping("/{id}")
    fun save(
        @PathVariable id: UUID,
        @Valid @RequestBody request: PostSaveRequest,
    ): AdminPostResponse = adminPostService.save(id, request)

    @PostMapping("/{id}/publish")
    fun publish(
        @PathVariable id: UUID,
        @Valid @RequestBody request: PostSaveRequest,
    ): AdminPostResponse = adminPostService.publish(id, request)
}
