package blog.auth.controller

import blog.auth.dto.response.CsrfResponse
import blog.auth.service.AuthService
import org.springframework.security.web.csrf.CsrfToken
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

/**
 * The CSRF cookie before a write. Spring Security answers the rest of `/api/auth`: the GitHub
 * redirect at `/github`, its callback at `/github/callback` and `POST /logout`.
 */
@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val authService: AuthService,
) {
    @GetMapping("/csrf")
    fun csrf(csrfToken: CsrfToken): CsrfResponse = authService.csrf(csrfToken)

    // Reached only without a GitHub client; with one, the OAuth filter answers this path first.
    @GetMapping("/github")
    fun github(): Unit = authService.loginUnavailable()
}
