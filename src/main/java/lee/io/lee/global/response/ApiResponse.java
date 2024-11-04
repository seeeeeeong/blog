package lee.io.lee.global.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lee.io.lee.global.exception.ErrorCode;
import lombok.Builder;
import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.validation.FieldError;

import java.util.List;

@Getter
@Builder
public class ApiResponse<T> {

    private final int code;      // HTTP 상태 코드
    private final String message; // 응답 메시지 ("요청 성공" 또는 "요청 실패")
    private final T data; // 성공 시 리턴되는 데이터

    @JsonInclude(JsonInclude.Include.NON_EMPTY)
    private List<ValidationError> errors; // 실패 시 유효성 검증 오류 목록

    @Getter
    @Builder
    public static class ValidationError {

        private final String field;
        private final String message;

        public static ValidationError of(final FieldError fieldError) {
            return ValidationError.builder()
                .field(fieldError.getField())
                .message(fieldError.getDefaultMessage())
                .build();
        }
    }

    /**
     * 성공 응답 생성 (OK 상태)
     *
     * @param data 응답 데이터
     * @param <T>  응답 데이터의 타입
     * @return ApiResponse<T> 성공 응답
     */
    public static <T> ApiResponse<T> success(T data) {
        return setData(HttpStatus.OK.value(), "응답 성공", data);
    }

    /**
     * 성공 응답 생성 (Created 상태)
     *
     * @param data 응답 데이터
     * @param <T>  응답 데이터의 타입
     * @return ApiResponse<T> 성공 응답
     */
    public static <T> ApiResponse<T> created(T data) {
        return setData(HttpStatus.CREATED.value(), "요청 성공", data);
    }

    /**
     * 실패 응답 생성
     *
     * @param errorCode 에러 코드 (ErrorCode enum 활용)
     * @return ApiResponse<?> 실패 응답
     */
    public static ApiResponse<?> failure(ErrorCode errorCode) {
        return setErrors(errorCode.getHttpStatus().value(), errorCode.getMessage(), null);
    }

    /**
     * 실패 응답 생성
     *
     * @param errorCode     에러 코드 (ErrorCode enum 활용)
     * @param customMessage 커스텀 메시지
     * @return ApiResponse<?> 실패 응답
     */
    public static ApiResponse<?> failure(ErrorCode errorCode, String customMessage) {
        String message = customMessage != null ? customMessage : errorCode.getMessage();
        return setErrors(errorCode.getHttpStatus().value(), message, null);
    }

    /**
     * 실패 응답 생성
     *
     * @param errorCode 에러 코드 (ErrorCode enum 활용)
     * @param e         예외 정보
     * @return ApiResponse<?> 실패 응답
     */
    public static ApiResponse<?> failure(ErrorCode errorCode, Throwable e) {
        return setErrors(errorCode.getHttpStatus().value(), errorCode.getMessage(e), null);
    }

    /**
     * 실패 응답 생성
     *
     * @param errorCode 에러 코드 (ErrorCode enum 활용)
     * @param errors    유효성 검증 오류 목록
     * @return ApiResponse<?> 실패 응답
     */
    public static ApiResponse<?> failure(ErrorCode errorCode, List<ValidationError> errors) {
        return setErrors(errorCode.getHttpStatus().value(), errorCode.getMessage(), errors);
    }


    private static <T> ApiResponse<T> setData(int code, String message, T data) {
        return ApiResponse.<T>builder()
            .code(code)
            .message(message)
            .data(data)
            .build();
    }

    private static ApiResponse<?> setErrors(int code, String message, List<ValidationError> errors) {
        return ApiResponse.builder()
            .code(code)
            .message(message)
            .errors(errors)
            .build();
    }
}
