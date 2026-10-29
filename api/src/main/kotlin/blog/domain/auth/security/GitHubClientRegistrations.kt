package blog.domain.auth.security

import org.springframework.beans.factory.annotation.Value
import org.springframework.security.oauth2.client.registration.ClientRegistration
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository
import org.springframework.security.oauth2.core.AuthorizationGrantType
import org.springframework.security.oauth2.core.ClientAuthenticationMethod
import org.springframework.stereotype.Component

/**
 * The one OAuth client, GitHub, or none when no client id is set: the app still serves every
 * public page, and admin sign-in answers that it is off.
 */
@Component
class GitHubClientRegistrations(
    @Value("\${blog.auth.github.client-id}") clientId: String,
    @Value("\${blog.auth.github.client-secret}") clientSecret: String,
    @Value("\${blog.auth.github.url}") gitHubUrl: String,
    @Value("\${blog.auth.github.api-url}") gitHubApiUrl: String,
    @Value("\${blog.public-url}") publicUrl: String,
) : ClientRegistrationRepository {
    // No scope: GitHub then grants read access to public profile data only, all sign-in needs.
    private val gitHub: ClientRegistration? =
        if (clientId.isBlank() || clientSecret.isBlank()) {
            null
        } else {
            ClientRegistration
                .withRegistrationId(ID)
                .clientName("GitHub")
                .clientId(clientId)
                .clientSecret(clientSecret)
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri("$publicUrl$CALLBACK")
                .authorizationUri("$gitHubUrl/login/oauth/authorize")
                .tokenUri("$gitHubUrl/login/oauth/access_token")
                .userInfoUri("$gitHubApiUrl/user")
                .userNameAttributeName("id")
                .build()
        }

    override fun findByRegistrationId(registrationId: String): ClientRegistration? =
        gitHub?.takeIf { it.registrationId == registrationId }

    companion object {
        const val ID = "github"
        const val BASE = "/api/auth"
        const val START = "$BASE/$ID"
        const val CALLBACK = "$START/callback"
    }
}
