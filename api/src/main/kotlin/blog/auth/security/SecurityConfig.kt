package blog.auth.security

import blog.common.exception.BlogError
import blog.common.exception.writeTo
import blog.common.security.SessionAdmin
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpStatus
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.logout.HttpStatusReturningLogoutSuccessHandler
import org.springframework.security.web.csrf.CookieCsrfTokenRepository
import org.springframework.security.web.csrf.CsrfException
import org.springframework.security.web.csrf.CsrfTokenRepository
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler
import tools.jackson.databind.json.JsonMapper

/** Readers need nothing; everything under `/api/admin/` needs the admin's session, and every write a CSRF token. */
@Configuration
class SecurityConfig {
    // A cookie rather than the session, so a reader never gets a stored session.
    // Readable by the page, which sends it back as X-XSRF-TOKEN; another site can neither read nor set it.
    @Bean
    fun csrfTokenRepository(
        @Value("\${server.servlet.session.cookie.secure}") secure: Boolean,
    ): CsrfTokenRepository =
        CookieCsrfTokenRepository().apply {
            setCookieCustomizer { it.httpOnly(false).sameSite("Lax").secure(secure) }
        }

    @Bean
    fun securityFilterChain(
        httpSecurity: HttpSecurity,
        jsonMapper: JsonMapper,
        csrfTokenRepository: CsrfTokenRepository,
        clientRegistrationRepository: ClientRegistrationRepository,
        gitHubAdminUserService: GitHubAdminUserService,
        adminLoginSuccessHandler: AdminLoginSuccessHandler,
        adminLoginFailureHandler: AdminLoginFailureHandler,
    ): SecurityFilterChain =
        httpSecurity
            .authorizeHttpRequests {
                it
                    .requestMatchers("/api/admin/**")
                    .hasRole(SessionAdmin.ROLE)
                    .anyRequest()
                    .permitAll()
            }.csrf {
                it.csrfTokenRepository(csrfTokenRepository)
                // Unmasked: the masking handler would refuse the token rotated at sign-in.
                it.csrfTokenRequestHandler(CsrfTokenRequestAttributeHandler())
            }.requestCache { it.disable() }
            .oauth2Login {
                it.clientRegistrationRepository(clientRegistrationRepository)
                // The web's page; set so Spring generates no login page of its own.
                it.loginPage(AdminLoginFailureHandler.LOGIN_PAGE)
                it.authorizationEndpoint { endpoint ->
                    endpoint.authorizationRequestResolver(
                        GitHubAuthorizationRequestResolver(clientRegistrationRepository),
                    )
                }
                it.redirectionEndpoint { endpoint -> endpoint.baseUri(GitHubClientRegistrations.CALLBACK) }
                it.userInfoEndpoint { endpoint -> endpoint.userService(gitHubAdminUserService) }
                it.successHandler(adminLoginSuccessHandler)
                it.failureHandler(adminLoginFailureHandler)
            }.logout {
                it.logoutUrl("/api/auth/logout")
                it.logoutSuccessHandler(HttpStatusReturningLogoutSuccessHandler(HttpStatus.NO_CONTENT))
            }.exceptionHandling {
                it.authenticationEntryPoint { _, response, _ -> BlogError.UNAUTHORIZED.writeTo(response, jsonMapper) }
                it.accessDeniedHandler { _, response, denied ->
                    val error = if (denied is CsrfException) BlogError.AUTH_INVALID_CSRF else BlogError.FORBIDDEN
                    error.writeTo(response, jsonMapper)
                }
            }.build()
}
