package blog.domain.auth.security

import blog.common.exception.BlogError
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.beans.factory.annotation.Value
import org.springframework.security.core.AuthenticationException
import org.springframework.security.oauth2.core.OAuth2AuthenticationException
import org.springframework.security.web.authentication.AuthenticationFailureHandler
import org.springframework.stereotype.Component

/** Back to the web's sign-in page with an error code it can show; GitHub's own errors become one. */
@Component
class AdminLoginFailureHandler(
    @Value("\${blog.public-url}") private val publicUrl: String,
) : AuthenticationFailureHandler {
    override fun onAuthenticationFailure(
        request: HttpServletRequest,
        response: HttpServletResponse,
        exception: AuthenticationException,
    ) {
        // A stranger keeps no session, not even the one that held the authorization request.
        request.getSession(false)?.invalidate()
        val code = (exception as? OAuth2AuthenticationException)?.error?.errorCode
        val error = if (code == BlogError.AUTH_NOT_ADMIN.code) BlogError.AUTH_NOT_ADMIN else BlogError.AUTH_LOGIN_FAILED
        response.sendRedirect("$publicUrl$LOGIN_PAGE?error=${error.code}")
    }

    companion object {
        const val LOGIN_PAGE = "/admin/login"
    }
}
