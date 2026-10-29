package blog.domain.book.controller

import blog.domain.book.dto.request.BookImportRequest
import blog.domain.book.dto.request.BookSearchRequest
import blog.domain.book.dto.request.BookTopicRequest
import blog.domain.book.dto.response.AdminBookResponse
import blog.domain.book.dto.response.BookEditionResponse
import blog.domain.book.service.AdminBookService
import blog.domain.book.service.BookSourceService
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.ModelAttribute
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/admin/books")
class AdminBookController(
    private val bookSourceService: BookSourceService,
    private val adminBookService: AdminBookService,
) {
    @GetMapping("/search")
    fun search(
        @Valid @ModelAttribute request: BookSearchRequest,
    ): List<BookEditionResponse> = bookSourceService.search(request)

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun import(
        @Valid @RequestBody request: BookImportRequest,
    ): AdminBookResponse = bookSourceService.import(request)

    @GetMapping
    fun list(): List<AdminBookResponse> = adminBookService.list()

    @GetMapping("/{id}")
    fun get(
        @PathVariable id: UUID,
    ): AdminBookResponse = adminBookService.get(id)

    @PutMapping("/{id}/topic")
    fun placeInTopic(
        @PathVariable id: UUID,
        @RequestBody request: BookTopicRequest,
    ): AdminBookResponse = adminBookService.placeInTopic(id, request)
}
