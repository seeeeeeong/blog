package lee.io.lee.global.swagger;

import io.swagger.v3.oas.models.examples.Example;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ExampleHolder {

    private Example holder; // API Operation Example 클래스
    private String name; // ErrorCode 에러명
    private int code; // HttpStatus 코드
}
