package lee.io.lee.domain.auth.properties;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.PropertySource;
import org.springframework.stereotype.Component;

@Getter
@Component
@PropertySource("classpath:application-oauth.yml")
public class AppleProperties {

    @Value("${oauth2.apple.client-id}")
    private String clientId;
    @Value("${oauth2.apple.key-id}")
    private String keyId;
    @Value("${oauth2.apple.team-id}")
    private String teamId;
    @Value("${oauth2.apple.private-key}")
    private String privateKey;
    @Value("${oauth2.apple.public-key-url}")
    private String publicKeyUrl;
    @Value("${oauth2.apple.token-url}")
    private String tokenUrl;
    @Value("${oauth2.apple.redirect-uri}")
    private String redirectUri;





}
