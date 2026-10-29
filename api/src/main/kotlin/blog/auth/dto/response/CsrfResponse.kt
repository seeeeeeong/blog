package blog.auth.dto.response

import org.springframework.security.web.csrf.CsrfToken

/** The page may as well read the token from the XSRF-TOKEN cookie this sets. */
data class CsrfResponse(
    val headerName: String,
    val token: String,
) {
    companion object {
        fun from(csrfToken: CsrfToken) = CsrfResponse(headerName = csrfToken.headerName, token = csrfToken.token)
    }
}
