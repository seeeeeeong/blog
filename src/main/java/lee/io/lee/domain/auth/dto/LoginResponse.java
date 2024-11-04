package lee.io.lee.domain.auth.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lee.io.lee.global.jwt.JwtTokenDto;
import lombok.Builder;
import lombok.Getter;

import java.util.Date;

@Getter
@Builder
public class LoginResponse {

    @Schema(description = "grantType", example = "Bearer", required = true)
    private String grantType;

    @Schema(description = "accessToken", example = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJBQ0NFU1MiLCJpYXQiOjE3MDU0ODk4NzksImV4cCI6MTcwNTQ5MDc3OSwibWVtYmVySWQiOjEsInJvbGUiOiJBRE1JTiJ9.hEQO-fU_4SPxwhmgdTG0iT0FaITbesofh0X7SSxmYPtzWpGyHBd63pE-LzUv22oJzHAQ3NUGs0mWGYiAy4qPNw", required = true)
    private String accessToken;

    @Schema(description = "access token 만료 시간", example = "2024-01-17 20:26:19", required = true)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Seoul")
    private Date accessTokenExpireTime;

    @Schema(description = "refreshToken", example = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJSRUZSRVNIIiwiaWF0IjoxNzA1NDg5ODc5LCJleHAiOjE3MDU0OTA3NzksIm1lbWJlcklkIjoxfQ.YOkTfgkfeT95V0vI9doZ1UAvSYI7THISbGK-asdsgagSzboVQG0m0ttNxzrxlTbZSbOIYABA8f7bxqA", required = true)
    private String refreshToken;

    @Schema(description = "refresh token 만료 시간", example = "2024-01-17 20:26:19", required = true)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Seoul")
    private Date refreshTokenExpireTime;

    public static LoginResponse of(JwtTokenDto jwtTokenDTO) {
        return LoginResponse.builder()
                .grantType(jwtTokenDTO.getGrantType())
                .accessToken(jwtTokenDTO.getAccessToken())
                .accessTokenExpireTime(jwtTokenDTO.getAccessTokenExpireTime())
                .refreshToken(jwtTokenDTO.getRefreshToken())
                .refreshTokenExpireTime(jwtTokenDTO.getRefreshTokenExpireTime())
                .build();
    }

}
