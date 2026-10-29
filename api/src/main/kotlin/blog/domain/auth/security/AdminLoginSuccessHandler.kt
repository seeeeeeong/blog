package blog.domain.auth.security

import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.beans.factory.annotation.Value
import org.springframework.security.core.Authentication
import org.springframework.security.web.authentication.AuthenticationSuccessHandler
import org.springframework.stereotype.Component
import java.time.Duration

@Component
class AdminLoginSuccessHandler(
    @Value("\${blog.public-url}") private val publicUrl: String,
    @Value("\${server.servlet.session.cookie.max-age}") private val sessionAge: Duration,
) : AuthenticationSuccessHandler {
    override fun onAuthenticationSuccess(
        request: HttpServletRequest,
        response: HttpServletResponse,
        authentication: Authentication,
    ) {
        // Only a signed-in session lives as long as its cookie; one left mid sign-in lapses with the default timeout.
        request.getSession(false)?.maxInactiveInterval = sessionAge.toSeconds().toInt()
        response.sendRedirect("$publicUrl$ADMIN_PAGE")
    }

    companion object {
        const val ADMIN_PAGE = "/admin"
    }
}
