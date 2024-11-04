package lee.io.lee.domain.auth.client;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import lee.io.lee.domain.auth.properties.AppleProperties;
import lee.io.lee.domain.auth.properties.GoogleProperties;
import lee.io.lee.domain.auth.properties.KakaoProperties;
import lee.io.lee.global.util.OAuth2Util;
import lombok.RequiredArgsConstructor;

import org.bouncycastle.asn1.pkcs.PrivateKeyInfo;
import org.bouncycastle.openssl.PEMException;
import org.bouncycastle.openssl.jcajce.JcaPEMKeyConverter;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.security.PrivateKey;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class AuthProviderClient {

    private final GoogleProperties googleProperties;
    private final KakaoProperties kakaoProperties;
    private final AppleProperties appleProperties;

    private final OAuth2Util oAuth2Util;

    public String getGoogleAccessToken(String code) {
        String decode = URLDecoder.decode(code, StandardCharsets.UTF_8);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        Map<String, String> body = new HashMap<>();
        body.put("client_id", googleProperties.getClientId());
        body.put("client_secret", googleProperties.getClientSecret());
        body.put("code", decode);
        body.put("grant_type", "authorization_code");
        body.put("redirect_uri", googleProperties.getRedirectUri());
        return oAuth2Util.getAccessToken(googleProperties.getTokenUrl(), headers, body);
    }

    public Map getUserInfo(String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        HttpEntity<String> request = new HttpEntity<>(headers);
        RestTemplate restTemplate = new RestTemplate();
        ResponseEntity<Map> response = restTemplate.exchange(googleProperties.getUserInfoUrl(), HttpMethod.GET, request, Map.class);
        return response.getBody();
    }

    public String getKakaoAccesssToken(String code) throws JsonProcessingException {
        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-type", "application/x-www-form-urlencoded;charset=utf-8");
        Map<String, String> body = new HashMap<>();
        body.put("client_id", kakaoProperties.getClientId());
        body.put("client_secret", kakaoProperties.getClientSecret());
        body.put("code", code);
        body.put("grant_type", "authorization_code");
        body.put("redirect_uri", kakaoProperties.getRedirectUri());
        return oAuth2Util.getAccessToken(kakaoProperties.getTokenUrl(), headers, body);
    }

    public Map getKakaoUserInfo(String accessToken) throws JsonProcessingException {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        HttpEntity<String> request = new HttpEntity<>(headers);
        RestTemplate restTemplate = new RestTemplate();
        ResponseEntity<String> response = restTemplate.exchange(
                kakaoProperties.getUserInfoUrl(),
                HttpMethod.POST,
                request,
                String.class
        );

        ObjectMapper objectMapper = new ObjectMapper();
        JsonNode jsonNode = objectMapper.readTree(response.getBody());

        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("id", jsonNode.get("id").asText());
        userInfo.put("email", jsonNode.get("kakao_account").get("email").asText());

        return userInfo;
    }

    public String getAppleIdToken(String code) {
        String clientSecret = createClientSecret();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        Map<String, String> body = new HashMap<>();
        body.put("client_id", appleProperties.getClientId());
        body.put("client_secret", clientSecret);
        body.put("code", code);
        body.put("grant_type", "authorization_code");
        body.put("redirect_uri", appleProperties.getRedirectUri());
        return oAuth2Util.getIdentityToken(appleProperties.getTokenUrl(), headers, body);
    }

    private String createClientSecret() {
        PrivateKey privateKey = getPrivateKey();
        long nowMillis  = System.currentTimeMillis();
        Date now = new Date(nowMillis);
        return Jwts.builder()
                .setHeaderParam("kid", appleProperties.getKeyId())
                .setIssuer(appleProperties.getTeamId())
                .setIssuedAt(now)
                .setExpiration(new Date(nowMillis + 86400000))// 1일
                .setAudience("https://appleid.apple.com")
                .setSubject(appleProperties.getClientId())
                .signWith(privateKey, SignatureAlgorithm.ES256)
                .compact();
    }

    private PrivateKey getPrivateKey() {
        JcaPEMKeyConverter converter = new JcaPEMKeyConverter().setProvider("BC");
        try {
            byte[] privateKeyBytes = Base64.getDecoder().decode(appleProperties.getPrivateKey());

            PrivateKeyInfo privateKeyInfo = PrivateKeyInfo.getInstance(privateKeyBytes);
            return converter.getPrivateKey(privateKeyInfo);
        } catch (PEMException e) {
            throw new RuntimeException(e);
        }
    }

}
