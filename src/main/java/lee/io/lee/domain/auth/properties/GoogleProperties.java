package lee.io.lee.domain.auth.properties;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.PropertySource;
import org.springframework.stereotype.Component;

@Getter
@Component
@PropertySource("classpath:application-oauth.yml")
public class GoogleProperties {

    @Value("${oauth2.google.client-id}")
    private String clientId;
    @Value("${oauth2.google.client-secret}")
    private String clientSecret;
    @Value("${oauth2.google.token-url}")
    private String tokenUrl;
    @Value("${oauth2.google.user-info-url}")
    private String userInfoUrl;
    @Value("${oauth2.google.redirect-uri}")
    private String redirectUri;

}
