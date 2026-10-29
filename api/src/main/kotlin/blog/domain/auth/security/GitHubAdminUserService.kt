package blog.domain.auth.security

import blog.common.exception.BlogException
import blog.common.security.SessionAdmin
import blog.domain.auth.dto.request.GitHubUserRequest
import blog.domain.auth.service.AuthService
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService
import org.springframework.security.oauth2.core.OAuth2AuthenticationException
import org.springframework.security.oauth2.core.OAuth2Error
import org.springframework.security.oauth2.core.user.OAuth2User
import org.springframework.stereotype.Component

/**
 * Reads the GitHub account and lets only the admin's through. The session keeps a
 * [SessionAdmin], not GitHub's whole profile.
 */
@Component
class GitHubAdminUserService(
    private val authService: AuthService,
) : OAuth2UserService<OAuth2UserRequest, OAuth2User> {
    private val gitHubUsers = DefaultOAuth2UserService()

    override fun loadUser(userRequest: OAuth2UserRequest): OAuth2User {
        val user = gitHubUsers.loadUser(userRequest)
        val request =
            GitHubUserRequest(
                login = user.getAttribute<String>("login").orEmpty(),
                name = user.getAttribute<String>("name"),
                avatarUrl = user.getAttribute<String>("avatar_url"),
            )
        val admin =
            try {
                authService.admit(request)
            } catch (exception: BlogException) {
                // Spring Security handles only its own exceptions here; anything else would be a 500.
                throw OAuth2AuthenticationException(OAuth2Error(exception.error.code), exception)
            }
        return SessionAdmin(login = admin.login, displayName = admin.name, avatarUrl = admin.avatarUrl)
    }
}
