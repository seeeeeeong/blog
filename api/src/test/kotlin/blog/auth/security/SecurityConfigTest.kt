package blog.auth.security

import blog.Browser
import blog.TestcontainersConfiguration
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.web.server.LocalServerPort
import org.springframework.context.ApplicationContext
import org.springframework.context.annotation.Import
import org.springframework.security.core.userdetails.UserDetailsService

/** Without GitHub credentials, as a local run starts. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Import(TestcontainersConfiguration::class)
class SecurityConfigTest(
    @LocalServerPort private val port: Int,
    @Autowired private val context: ApplicationContext,
) {
    @Test
    fun `no default user is made, so no generated password is logged`() {
        assertThat(context.getBeanNamesForType(UserDetailsService::class.java)).isEmpty()
    }

    @Test
    fun `a reader is given no cookie, so no session is stored for one`() {
        val browser = Browser(port)

        listOf("/api/posts", "/api/topics", "/api/posts/missing", "/actuator/health").forEach { path ->
            assertThat(browser.get(path).setCookies).describedAs(path).isEmpty()
        }
    }

    @Test
    fun `without GitHub credentials the app serves readers and says admin sign-in is off`() {
        val browser = Browser(port)

        val posts = browser.get("/api/posts")
        val signIn = browser.get("/api/auth/github")

        assertThat(posts.status).isEqualTo(200)
        assertThat(signIn.status).isEqualTo(503)
        assertThat(signIn.code).isEqualTo("auth.login_unavailable")
        assertThat(browser.cookie("blog_session")).isNull()
    }

    @Test
    fun `without GitHub credentials a callback still fails cleanly`() {
        val callback = Browser(port).get("/api/auth/github/callback?code=fake-code&state=forged")

        assertThat(callback.status).isEqualTo(302)
        assertThat(callback.location).isEqualTo("http://localhost:3150/admin/login?error=auth.login_failed")
    }
}
