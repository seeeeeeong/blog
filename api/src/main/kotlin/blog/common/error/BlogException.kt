package blog.common.error

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity

/** [cause] keeps what went wrong underneath for the log; the reader only sees [error]. */
open class BlogException(
    val error: ErrorCode,
    cause: Throwable? = null,
) : RuntimeException(error.code, cause)

/** Each module keeps its own enum of these, so no module edits another's list. */
interface ErrorCode {
    val status: HttpStatus
    val code: String
    val message: String
}

data class ErrorResponse(
    val code: String,
    val message: String,
)

fun ErrorCode.toResponse() = ErrorResponse(code, message)

fun ErrorCode.toResponseEntity(): ResponseEntity<ErrorResponse> = ResponseEntity.status(status).body(toResponse())
