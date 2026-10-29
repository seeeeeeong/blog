package blog.common.exception

import org.springframework.http.HttpStatus

/** Every error the api answers, in one list; the code names the feature it belongs to. */
enum class BlogError(
    override val status: HttpStatus,
    override val code: String,
    override val message: String,
) : ErrorCode {
    INVALID_INPUT(HttpStatus.BAD_REQUEST, "common.invalid_input", "입력값을 확인해 주세요"),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "common.unauthorized", "로그인이 필요합니다"),
    FORBIDDEN(HttpStatus.FORBIDDEN, "common.forbidden", "권한이 없습니다"),
    NOT_FOUND(HttpStatus.NOT_FOUND, "common.not_found", "찾을 수 없습니다"),
    METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "common.method_not_allowed", "지원하지 않는 요청입니다"),
    UNSUPPORTED_MEDIA_TYPE(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "common.unsupported_media_type", "지원하지 않는 형식입니다"),
    INTERNAL(HttpStatus.INTERNAL_SERVER_ERROR, "common.internal", "잠시 후 다시 시도해 주세요"),
    AUTH_NOT_ADMIN(HttpStatus.FORBIDDEN, "auth.not_admin", "관리자 계정으로만 로그인할 수 있습니다"),
    AUTH_LOGIN_FAILED(HttpStatus.UNAUTHORIZED, "auth.login_failed", "GitHub 로그인에 실패했습니다. 다시 시도해 주세요"),
    AUTH_LOGIN_UNAVAILABLE(HttpStatus.SERVICE_UNAVAILABLE, "auth.login_unavailable", "관리자 로그인이 설정되지 않았습니다"),
    AUTH_INVALID_CSRF(HttpStatus.FORBIDDEN, "auth.invalid_csrf", "요청을 확인할 수 없습니다. 새로고침 후 다시 시도해 주세요"),
    POST_NOT_FOUND(HttpStatus.NOT_FOUND, "post.not_found", "글을 찾을 수 없습니다"),
    POST_TOPIC_NOT_FOUND(HttpStatus.BAD_REQUEST, "post.topic_not_found", "주제를 찾을 수 없습니다"),
    POST_SLUG_TAKEN(HttpStatus.CONFLICT, "post.slug_taken", "다른 글이 이미 쓰는 주소입니다"),
    POST_POSITION_TAKEN(HttpStatus.CONFLICT, "post.position_taken", "주제 안에서 다른 글이 이미 쓰는 순서입니다"),
    POST_SUMMARY_REQUIRED(HttpStatus.BAD_REQUEST, "post.summary_required", "발행하려면 요약을 적어 주세요"),
    POST_EDIT_CONFLICT(HttpStatus.CONFLICT, "post.edit_conflict", "다른 곳에서 먼저 고친 글입니다. 새로고침 후 다시 시도해 주세요"),
    POST_PUBLISHED_LOCKED(HttpStatus.CONFLICT, "post.published_locked", "발행한 글은 다시 발행해야 바뀝니다"),
}
