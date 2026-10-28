package blog.common.exception

import blog.common.util.traceOf
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException
import java.util.UUID
import org.springframework.web.ErrorResponse as SpringErrorResponse

@RestControllerAdvice
class GlobalExceptionHandler {
    private val log = LoggerFactory.getLogger(javaClass)

    @ExceptionHandler(BlogException::class)
    fun handle(exception: BlogException): ResponseEntity<ErrorResponse> {
        // An answer the reader expects, but a cause underneath (a provider's failure) is the
        // operator's to see. Types and frames only, as below.
        exception.cause?.let { log.warn("{} caused by{}", exception.error.code, traceOf(it)) }
        return exception.error.toResponseEntity()
    }

    @ExceptionHandler(
        MethodArgumentNotValidException::class,
        HttpMessageNotReadableException::class,
        MethodArgumentTypeMismatchException::class,
    )
    fun handleInvalidInput(): ResponseEntity<ErrorResponse> = BlogError.INVALID_INPUT.toResponseEntity()

    @ExceptionHandler(Exception::class)
    fun handleUnexpected(exception: Exception): ResponseEntity<ErrorResponse> {
        // Spring's own 4xx (no route, wrong method, wrong media type) keep their status instead of becoming a 500.
        val status = (exception as? SpringErrorResponse)?.statusCode?.value()
        return when {
            status == HttpStatus.NOT_FOUND.value() -> {
                BlogError.NOT_FOUND.toResponseEntity()
            }

            status == HttpStatus.METHOD_NOT_ALLOWED.value() -> {
                BlogError.METHOD_NOT_ALLOWED.toResponseEntity()
            }

            status == HttpStatus.UNSUPPORTED_MEDIA_TYPE.value() -> {
                BlogError.UNSUPPORTED_MEDIA_TYPE.toResponseEntity()
            }

            status != null && status < HttpStatus.INTERNAL_SERVER_ERROR.value() -> {
                ResponseEntity.status(status).body(BlogError.INVALID_INPUT.toResponse())
            }

            else -> {
                internal(exception)
            }
        }
    }

    private fun internal(exception: Exception): ResponseEntity<ErrorResponse> {
        val incident = UUID.randomUUID().toString().take(INCIDENT_LENGTH)
        // Types and frames only: a message can carry a secret or a reader's text.
        log.error("Unhandled exception [{}]{}", incident, traceOf(exception))
        val error = BlogError.INTERNAL
        return ResponseEntity
            .status(error.status)
            .body(ErrorResponse(error.code, "${error.message} (오류 번호 $incident)"))
    }

    private companion object {
        // Eight hex digits are enough to find one failure in a day's log.
        const val INCIDENT_LENGTH = 8
    }
}
