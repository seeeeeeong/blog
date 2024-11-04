package lee.io.lee.domain.auth.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.nimbusds.jose.JOSEException;
import lee.io.lee.domain.auth.dto.LoginResponse;
import lee.io.lee.domain.auth.service.AuthService;
import lee.io.lee.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.text.ParseException;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * <p>구글 로그인</p>
     *
     * @param code 구글 authCode
     * @return accessToken, refreshToken
     */
    @GetMapping("/login/oauth2/callback/google")
    public ApiResponse<LoginResponse> googleLogin(@RequestParam(name = "code") String code) {
        return ApiResponse.success(authService.googleLogin(code));
    }

    /**
     * <p>카카오 로그인</p>
     *
     * @param code 카카오 authCode
     * @return accessToken, refreshToken
     */
    @GetMapping("/login/oauth2/callback/kakao")
    public ApiResponse<LoginResponse> kakaoLogin(@RequestParam(name = "code") String code) throws JsonProcessingException {
        return ApiResponse.success(authService.kakaoLogin(code));
    }

    /**
     * <p>애플 로그인</p>
     **
     * @param code 애플 authCode
     * @return accessToken, refreshToken
     */
    @GetMapping
    public ApiResponse<LoginResponse> appleLogin(@RequestParam(name = "code") String code) throws ParseException, JOSEException, IOException {
        return ApiResponse.success(authService.appleLogin(code));
    }

}
