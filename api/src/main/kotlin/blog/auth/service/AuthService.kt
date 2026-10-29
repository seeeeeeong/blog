package blog.auth.service

import blog.auth.dto.request.GitHubUserRequest
import blog.auth.dto.response.AdminResponse
import blog.auth.dto.response.CsrfResponse
import blog.auth.entity.AdminCheck
import blog.common.exception.BlogError
import blog.common.exception.BlogException
import blog.common.security.SessionAdmin
import org.springframework.beans.factory.annotation.Value
import org.springframework.security.web.csrf.CsrfToken
import org.springframework.stereotype.Service

/** Who may sign in. GitHub vouches for the account; this decides whether it is the admin. */
@Service
class AuthService(
    @Value("\${blog.auth.admin-github-login}") adminGithubLogin: String,
) {
    private val adminCheck = AdminCheck(adminGithubLogin)

    fun admit(request: GitHubUserRequest): AdminResponse {
        if (!adminCheck.admits(request.login)) throw BlogException(BlogError.AUTH_NOT_ADMIN)
        return AdminResponse(
            login = request.login,
            name = request.name?.takeIf { it.isNotBlank() } ?: request.login,
            avatarUrl = request.avatarUrl,
        )
    }

    fun me(admin: SessionAdmin): AdminResponse = AdminResponse.from(admin)

    // Reading the token is what writes its cookie.
    fun csrf(csrfToken: CsrfToken): CsrfResponse = CsrfResponse.from(csrfToken)

    fun loginUnavailable(): Nothing = throw BlogException(BlogError.AUTH_LOGIN_UNAVAILABLE)
}
