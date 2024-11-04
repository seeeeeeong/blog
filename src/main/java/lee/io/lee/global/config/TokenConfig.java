package lee.io.lee.global.config;

import lee.io.lee.global.jwt.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TokenConfig {

    @Value("${token.access-token-expiration-time}")
    private String accessTokenExpirationTime;

    @Value("${token.refresh-token-expiration-time}")
    private String refreshTokenExpirationTime;

    @Value("${token.secret}")
    private String tokenSecret;

    @Bean
    public JwtTokenProvider tokenManager() {
        return new JwtTokenProvider(accessTokenExpirationTime, refreshTokenExpirationTime, tokenSecret);
    }

}
