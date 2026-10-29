package blog.domain.book.dto.request

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

/** `?q=`: a title or a few words to find the editions by. */
data class BookSearchRequest(
    @field:NotBlank
    @field:Size(max = 100)
    val q: String = "",
)
