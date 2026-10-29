package blog.book.dto.response

import blog.post.dto.response.AdminPostResponse
import org.springframework.http.HttpStatus

/** The post for a section: [created] now, or the one it already had. */
data class SectionPostResponse(
    val post: AdminPostResponse,
    val created: Boolean,
) {
    val status: HttpStatus get() = if (created) HttpStatus.CREATED else HttpStatus.OK
}
