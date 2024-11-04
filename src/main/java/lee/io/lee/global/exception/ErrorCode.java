package lee.io.lee.global.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

import java.util.Optional;
import java.util.function.Predicate;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // Success
    OK(HttpStatus.OK, "OK"),

    // Common
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버에 오류가 발생했습니다."),
    METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "지원하지 않는 HTTP Method 요청입니다."),
    API_NOT_FOUND(HttpStatus.NOT_FOUND, "요청한 API를 찾을 수 없습니다."),
    QUERY_PARAMETER_REQUIRED(HttpStatus.BAD_REQUEST, "쿼리 파라미터가 필요한 API입니다."),
    INVALID_INPUT_VALUE(HttpStatus.BAD_REQUEST, "입력값이 올바르지 않습니다."),

    // Authorization
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "인증되지 않은 사용자입니다."),
    MALFORMED_JWT(HttpStatus.UNAUTHORIZED, "올바르지 않은 형식의 JWT 토큰입니다."),
    EXPIRED_JWT(HttpStatus.UNAUTHORIZED, "만료된 JWT 토큰입니다."),
    UNSUPPORTED_JWT(HttpStatus.UNAUTHORIZED, "지원하지 않는 JWT 토큰입니다."),
    ILLEGAL_JWT(HttpStatus.UNAUTHORIZED, "잘못된 JWT 토큰입니다."),
    INVALID_REFRESH_TOKEN(HttpStatus.UNAUTHORIZED, "유효하지 않은 Refresh Token입니다."),
    AUTH_INFO_NOT_FOUND(HttpStatus.UNAUTHORIZED, "Security Context에 인증 정보가 없습니다."),

    // DB
    DATABASE_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "DB 서버 연동에 오류가 발생했습니다."),

    // File
    FILE_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "파일 서버 연동에 오류가 발생했습니다."),

    // FCM
    FCM_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "FCM 서버 연동에 오류가 발생했습니다."),

    // Not Found
    PERFORMANCE_NOT_FOUND(HttpStatus.NOT_FOUND, "공연 정보를 찾을 수 없습니다."),
    PLACE_NOT_FOUND(HttpStatus.NOT_FOUND, "장소 정보를 찾을 수 없습니다."),
    ARTIST_NOT_FOUND(HttpStatus.NOT_FOUND, "아티스트 정보를 찾을 수 없습니다."),
    MEMBER_NOT_FOUND(HttpStatus.NOT_FOUND, "유저 정보를 찾을 수 없습니다."),
    AUTH_NOT_FOUND(HttpStatus.NOT_FOUND, "AUTH 정보를 찾을 수 없습니다."),
    TOKEN_NOT_FOUND(HttpStatus.NOT_FOUND, "토큰 정보를 찾을 수 없습니다."),
    JWT_REFRESH_TOKEN_NOT_FOUND(HttpStatus.NOT_FOUND, "Refresh 토큰 정보를 찾을 수 없습니다."),

    // Unsupported
    UNSUPPORTED_LOGIN_TYPE(HttpStatus.BAD_REQUEST, "지원하지 않는 로그인 타입입니다."),

    // Member
    MEMBER_ALREADY_EXIST(HttpStatus.CONFLICT, "이미 가입된 회원입니다."),
    INVALID_MEMBER(HttpStatus.UNAUTHORIZED, "유효하지 않은 회원입니다."),

    ;

    private final HttpStatus httpStatus;
    private final String message;

    public String getMessage(Throwable throwable) {
        return this.getMessage(this.getMessage(this.getMessage() + " - " + throwable.getMessage()));
    }

    public String getMessage(String message) {
        return Optional.ofNullable(message)
            .filter(Predicate.not(String::isBlank))
            .orElse(this.getMessage());
    }
}
