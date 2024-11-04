package lee.io.lee.global.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.models.Operation;
import io.swagger.v3.oas.models.examples.Example;
import io.swagger.v3.oas.models.media.Content;
import io.swagger.v3.oas.models.media.MediaType;
import io.swagger.v3.oas.models.responses.ApiResponse;
import io.swagger.v3.oas.models.responses.ApiResponses;
import lee.io.lee.global.exception.ErrorCode;
import lee.io.lee.global.swagger.ApiErrorCode;
import lee.io.lee.global.swagger.ApiErrorCodes;
import lee.io.lee.global.swagger.ExampleHolder;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.customizers.OperationCustomizer;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.HandlerMethod;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@OpenAPIDefinition(info = @Info(title = "blog API 문서",
        description = "blog 프로젝트 관련 API 문서입니다.", version = "v1")
)
@SecurityScheme(
        name = "Bearer Authentication",
        type = SecuritySchemeType.HTTP,
        in = SecuritySchemeIn.HEADER,
        bearerFormat = "JWT",
        scheme = "bearer"
)
@Configuration
@RequiredArgsConstructor
public class SwaggerConfig {

    @Bean
    public GroupedOpenApi blogOpenApi() {
        String[] paths = {"/**"};

        return GroupedOpenApi
                .builder()
                .group("blog API")
                .pathsToMatch(paths)
                .build();
    }

    /**
     * <p>
     * <b>어노테이션별 메서드 호출</b> <br/>
     * 메서드 위에 @ApiErrorCodes 나 @ApiErrorCode 가 달렸는지 확인하고 어노테이션에 따라 알맞는 메서드를 호출한다.
     * </p>
     *
     * @return OperationCustomizer
     */
    @Bean
    public OperationCustomizer customize() {
        return (Operation operation, HandlerMethod handlerMethod) -> {
            ApiErrorCodes apiErrorCodes = handlerMethod.getMethodAnnotation(ApiErrorCodes.class);

            // @ApiErrorCodes 어노테이션이 있는 경우
            if (apiErrorCodes != null) {
                generateErrorCodeResponse(operation, apiErrorCodes.value());
            } else {
                ApiErrorCode apiErrorCode = handlerMethod.getMethodAnnotation(ApiErrorCode.class);

                // @ApiErrorCode 어노테이션이 있는 경우
                if (apiErrorCode != null) {
                    generateErrorCodeResponse(operation, apiErrorCode.value());
                }
            }

            return operation;
        };
    }

    /**
     * <p>다중 에러 응답값 추가</p>
     *
     * @param operation  API Operation 모델링 클래스
     * @param errorCodes 에러 코드 정보
     */
    private void generateErrorCodeResponse(Operation operation, ErrorCode[] errorCodes) {
        ApiResponses responses = operation.getResponses();

        // ExampleHolder(에러 응답값) 객체를 만들고 에러 코드별로 그룹화
        Map<Integer, List<ExampleHolder>> statusWithExampleHolders = Arrays.stream(errorCodes)
                .map(
                        errorCode -> ExampleHolder.builder()
                                .holder(getSwaggerExample(errorCode))
                                .code(errorCode.getHttpStatus().value())
                                .name(errorCode.name())
                                .build()
                )
                .collect(Collectors.groupingBy(ExampleHolder::getCode));

        // ExampleHolders를 ApiResponses에 추가
        addExamplesToResponses(responses, statusWithExampleHolders);
    }

    /**
     * <p>단일 에러 응답값 추가</p>
     *
     * @param operation API Operation 모델링 클래스
     * @param errorCode 에러 코드 정보
     */
    private void generateErrorCodeResponse(Operation operation, ErrorCode errorCode) {
        ApiResponses responses = operation.getResponses();

        // ExampleHolder 객체 생성 및 ApiResponses에 추가
        ExampleHolder exampleHolder = ExampleHolder.builder()
                .holder(getSwaggerExample(errorCode))
                .name(errorCode.name())
                .code(errorCode.getHttpStatus().value())
                .build();

        addExamplesToResponses(responses, exampleHolder);
    }

    /**
     * <p>커스텀 ApiResponse 형태의 예시 객체 생성</p>
     *
     * @param errorCode 에러 코드 정보
     * @return API Operation Example 클래스
     */
    private Example getSwaggerExample(ErrorCode errorCode) {
        Example example = new Example();
        example.setValue(lee.io.lee.global.response.ApiResponse.failure(errorCode));

        return example;
    }

    /**
     * <p>다중 ExampleHolder를 ApiResponses에 추가</p>
     *
     * @param responses                ApiResponses 정보
     * @param statusWithExampleHolders 상태 코드 + ExampleHolder(에러 응답값) 객체
     */
    private void addExamplesToResponses(ApiResponses responses,
                                        Map<Integer, List<ExampleHolder>> statusWithExampleHolders) {
        statusWithExampleHolders.forEach(
                (status, v) -> {
                    Content content = new Content();
                    MediaType mediaType = new MediaType();
                    ApiResponse apiResponse = new ApiResponse();

                    v.forEach(
                            exampleHolder -> mediaType.addExamples(
                                    exampleHolder.getName(),
                                    exampleHolder.getHolder()
                            )
                    );
                    content.addMediaType("application/json", mediaType);
                    apiResponse.setContent(content);
                    responses.addApiResponse(String.valueOf(status), apiResponse);
                }
        );
    }

    /**
     * <p>단일 ExampleHolder를 ApiResponses에 추가</p>
     *
     * @param responses     ApiResponses 정보
     * @param exampleHolder ExampleHolder(에러 응답값) 객체
     */
    private void addExamplesToResponses(ApiResponses responses, ExampleHolder exampleHolder) {
        Content content = new Content();
        MediaType mediaType = new MediaType();
        ApiResponse apiResponse = new ApiResponse();

        mediaType.addExamples(exampleHolder.getName(), exampleHolder.getHolder());
        content.addMediaType("application/json", mediaType);
        apiResponse.content(content);
        responses.addApiResponse(String.valueOf(exampleHolder.getCode()), apiResponse);
    }

}
