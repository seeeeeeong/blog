package blog.auth.security

import jakarta.servlet.http.HttpServletRequest
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest

/**
 * Starts sign-in at `/api/auth/github` only. The default resolver reads every `/api/auth/{id}` as
 * a client id and answers a 500 for `/api/auth/csrf`; without a client, the path falls through to
 * the controller that says sign-in is off.
 */
class GitHubAuthorizationRequestResolver(
    private val clientRegistrationRepository: ClientRegistrationRepository,
) : OAuth2AuthorizationRequestResolver {
    private val resolver =
        DefaultOAuth2AuthorizationRequestResolver(clientRegistrationRepository, GitHubClientRegistrations.BASE)

    override fun resolve(request: HttpServletRequest): OAuth2AuthorizationRequest? {
        if (request.requestURI != GitHubClientRegistrations.START) return null
        val gitHub = clientRegistrationRepository.findByRegistrationId(GitHubClientRegistrations.ID)
        return gitHub?.let { resolver.resolve(request) }
    }

    override fun resolve(
        request: HttpServletRequest,
        clientRegistrationId: String,
    ): OAuth2AuthorizationRequest? = resolver.resolve(request, clientRegistrationId)
}
