package blog.domain.book.controller

import blog.domain.book.dto.response.BookResponse
import blog.domain.book.dto.response.BookSummaryResponse
import blog.domain.book.service.BookService
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/books")
class BookController(
    private val bookService: BookService,
) {
    @GetMapping
    fun list(): List<BookSummaryResponse> = bookService.list()

    @GetMapping("/{id}")
    fun get(
        @PathVariable id: UUID,
    ): BookResponse = bookService.get(id)
}
