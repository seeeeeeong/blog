package lee.io.lee.global.exception;


import lee.io.lee.global.response.ApiResponse;
import lee.io.lee.global.response.ApiResponse.ValidationError;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSourceResolvable;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.validation.BindException;
import org.springframework.validation.method.ParameterValidationResult;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.sql.SQLException;
import java.util.List;
import java.util.stream.Collectors;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    // 비즈니스 예외 처리
    @ExceptionHandler(BusinessException.class)
    protected ApiResponse<?> handleBusinessException(BusinessException e) {
        log.error(e.toString(), e);
        return ApiResponse.failure(e.getErrorCode());
    }

    // 지원하지 않는 HTTP method를 호출할 경우
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    protected ApiResponse<?> handleHttpRequestMethodNotSupportedException(
            HttpRequestMethodNotSupportedException e) {
        log.error("HttpRequestMethodNotSupportedException : {}", e.getMessage());
        return ApiResponse.failure(ErrorCode.METHOD_NOT_ALLOWED);
    }

    // 존재하지 않는 URI에 접근할 경우
    @ExceptionHandler(NoResourceFoundException.class)
    protected ApiResponse<?> handleNoResourceFoundException() {
        return ApiResponse.failure(ErrorCode.API_NOT_FOUND);
    }

    // 쿼리 파라미터 없이 요청할 경우
    @ExceptionHandler(MissingServletRequestParameterException.class)
    protected ApiResponse<?> handleMissingServletRequestParameterException() {
        return ApiResponse.failure(ErrorCode.QUERY_PARAMETER_REQUIRED);
    }

    // 매개변수 유효성 검증에 실패할 경우
    @ExceptionHandler(HandlerMethodValidationException.class)
    protected ApiResponse<?> handleHandlerMethodValidationException(HandlerMethodValidationException e) {
        log.error(e.toString(), e);
        return ApiResponse.failure(ErrorCode.INVALID_INPUT_VALUE, getValidationErrorMessage(e));
    }

    // @Valid 유효성 검증에 실패할 경우
    @ExceptionHandler(MethodArgumentNotValidException.class)
    protected ApiResponse<?> handleMethodArgumentNotValidException(MethodArgumentNotValidException e) {
        log.error(e.toString(), e);
        return ApiResponse.failure(ErrorCode.INVALID_INPUT_VALUE, getValidationError(e));
    }

    // 그 밖에 발생하는 모든 예외 처리
    @ExceptionHandler(value = {Exception.class, RuntimeException.class, SQLException.class,
            DataIntegrityViolationException.class})
    protected ApiResponse<?> handleException(Exception e) {
        log.error(e.toString(), e);
        return ApiResponse.failure(ErrorCode.INTERNAL_ERROR, e);
    }

    // 유효성 검증 메시지 생성 (HandlerMethodValidationException)
    private String getValidationErrorMessage(HandlerMethodValidationException e) {
        return e.getAllValidationResults().stream()
                .map(ParameterValidationResult::getResolvableErrors)
                .flatMap(List::stream)
                .map(MessageSourceResolvable::getDefaultMessage)
                .collect(Collectors.joining(", "));
    }

    // 유효성 검증 오류 메시지 리스트 생성 (BindException)
    private List<ValidationError> getValidationError(BindException e) {
        return e.getBindingResult().getFieldErrors().stream()
                .map(ValidationError::of)
                .collect(Collectors.toList());
    }
}
