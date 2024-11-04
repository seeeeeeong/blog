package lee.io.lee.global.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.PropertySource;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@RequiredArgsConstructor
@PropertySource("classpath:application-oauth.yml")
public class JwtTokenProvider {

    private final String accessTokenExpiredTime;
    private final String refreshTokenExpiredTime;
    private final String tokenSecret;

    public JwtTokenDto createJwtTokenDto(Long memberId) {
        Date accessTokenExpiredTime = createAccessTokenExpiredTime();
        Date refreshTokenExpiredTime = createRefreshTokenExpiredTime();

        String accessToken = createAccessToken(memberId, accessTokenExpiredTime);
        String refreshToken = createRefreshToken(memberId, refreshTokenExpiredTime);

        return JwtTokenDto.builder()
                .grantType(GrantType.BEARER.getDescription())
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .accessTokenExpireTime(accessTokenExpiredTime)
                .refreshTokenExpireTime(refreshTokenExpiredTime)
                .build();
    }

    public Date createAccessTokenExpiredTime() {
        return new Date(System.currentTimeMillis() + Long.parseLong(accessTokenExpiredTime));
    }

    public Date createRefreshTokenExpiredTime() {
        return new Date(System.currentTimeMillis() + Long.parseLong(refreshTokenExpiredTime));
    }


    public String createAccessToken(Long memberId, Date expirationTime) {

        Map<String, Object> header = new HashMap<>();
        header.put("typ", "JWT");

        Claims claims = Jwts.claims();
        claims.put("memberId", memberId);

        return Jwts.builder()
                .setHeader(header)
                .setSubject(TokenType.ACCESS.name())
                .setClaims(claims)
                .setIssuedAt(new Date())
                .setExpiration(expirationTime)
                .signWith(SignatureAlgorithm.HS512, tokenSecret.getBytes(StandardCharsets.UTF_8))
                .compact();
    }

    public String createRefreshToken(Long memberId, Date expirationTime) {

        Map<String, Object> header = new HashMap<>();
        header.put("typ", "JWT");

        Claims claims = Jwts.claims();
        claims.put("memberId", memberId);

        return Jwts.builder()
                .setHeader(header)
                .setSubject(TokenType.REFRESH.name())
                .setClaims(claims)
                .setIssuedAt(new Date())
                .setExpiration(expirationTime)
                .signWith(SignatureAlgorithm.HS512, tokenSecret.getBytes(StandardCharsets.UTF_8))
                .compact();
    }


}
