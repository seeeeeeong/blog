package blog.common.exception

import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import tools.jackson.databind.json.JsonMapper

/** [BlogError] holds the api's own; a test may bring a sample of its own. */
interface ErrorCode {
    val status: HttpStatus
    val code: String
    val message: String
}

fun ErrorCode.toResponse() = ErrorResponse(code, message)

fun ErrorCode.toResponseEntity(): ResponseEntity<ErrorResponse> = ResponseEntity.status(status).body(toResponse())

/** For the security filters, which answer before any controller advice can. */
fun ErrorCode.writeTo(
    response: HttpServletResponse,
    jsonMapper: JsonMapper,
) {
    response.status = status.value()
    response.contentType = MediaType.APPLICATION_JSON_VALUE
    response.characterEncoding = Charsets.UTF_8.name()
    jsonMapper.writeValue(response.outputStream, toResponse())
}
