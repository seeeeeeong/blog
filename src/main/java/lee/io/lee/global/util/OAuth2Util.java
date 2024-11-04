package lee.io.lee.global.util;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Component
public class OAuth2Util {

    public String getAccessToken(String tokenUrl, HttpHeaders headers, Map<String, String> bodyMap) { // 카카오로그인, 구글로그인
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.setAll(bodyMap);
        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);
        RestTemplate restTemplate = new RestTemplate();
        ResponseEntity<Map> response = restTemplate.postForEntity(tokenUrl, request, Map.class);
        return (String) response.getBody().get("access_token");
    }

    public String getIdentityToken(String tokenUrl, HttpHeaders headers, Map<String, String> bodyMap) { // 애플로그인
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.setAll(bodyMap);
        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);
        RestTemplate restTemplate = new RestTemplate();
        ResponseEntity<Map> response = restTemplate.postForEntity(tokenUrl, request, Map.class);
        return (String) response.getBody().get("id_token");
    }

}
