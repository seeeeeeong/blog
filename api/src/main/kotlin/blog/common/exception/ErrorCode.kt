package blog.common.exception

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity

/** [BlogError] holds the api's own; a test may bring a sample of its own. */
interface ErrorCode {
    val status: HttpStatus
    val code: String
    val message: String
}

fun ErrorCode.toResponse() = ErrorResponse(code, message)

fun ErrorCode.toResponseEntity(): ResponseEntity<ErrorResponse> = ResponseEntity.status(status).body(toResponse())
