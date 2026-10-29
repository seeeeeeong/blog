package blog.domain.auth.controller

import blog.Browser
import blog.TestcontainersConfiguration
import blog.domain.auth.FakeGitHub
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.web.server.LocalServerPort
import org.springframework.context.annotation.Import
import org.springframework.security.authentication.TestingAuthenticationToken
import org.springframework.security.core.context.SecurityContextImpl
import org.springframework.security.web.context.HttpSessionSecurityContextRepository
import org.springframework.session.Session
import org.springframework.session.SessionRepository
import org.springframework.session.jdbc.JdbcIndexedSessionRepository
import java.util.Base64

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Import(TestcontainersConfiguration::class, FakeGitHub.Config::class)
class AdminControllerTest(
    @LocalServerPort private val port: Int,
    @Autowired private val fakeGitHub: FakeGitHub,
    @Autowired sessionRepository: JdbcIndexedSessionRepository,
) {
    // Its session type is package-private; a session is a session to this test.
    @Suppress("UNCHECKED_CAST")
    private val sessions = sessionRepository as SessionRepository<Session>

    @AfterEach
    fun resetGitHub() {
        fakeGitHub.name = "이신성"
    }

    @Test
    fun `the admin reads who is signed in`() {
        val browser = Browser(port)
        fakeGitHub.signIn(browser)

        val me = browser.get("/api/admin/me")

        assertThat(me.status).isEqualTo(200)
        assertThat(me.body?.get("login")?.asString()).isEqualTo("seeeeeeong")
        assertThat(me.body?.get("name")?.asString()).isEqualTo("이신성")
        assertThat(me.body?.get("avatarUrl")?.asString()).isEqualTo("https://avatars.example/u/1")
    }

    @Test
    fun `an account without a name goes by its login`() {
        val browser = Browser(port)
        fakeGitHub.name = null
        fakeGitHub.signIn(browser)

        val me = browser.get("/api/admin/me")

        assertThat(me.body?.get("name")?.asString()).isEqualTo("seeeeeeong")
    }

    @Test
    fun `without a session it answers 401, not a redirect to a login page`() {
        val me = Browser(port).get("/api/admin/me")

        assertThat(me.status).isEqualTo(401)
        assertThat(me.code).isEqualTo("common.unauthorized")
    }

    @Test
    fun `a signed-in session that is not the admin's answers 403`() {
        // Sign-in never gives anyone else a session; one stored by hand stands in for a future role.
        val session = sessions.createSession()
        val reader = TestingAuthenticationToken("reader", null, "ROLE_READER")
        session.setAttribute(
            HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,
            SecurityContextImpl(reader),
        )
        sessions.save(session)
        val browser = Browser(port)
        browser.setCookie("blog_session", Base64.getEncoder().encodeToString(session.id.toByteArray()))

        val me = browser.get("/api/admin/me")

        assertThat(me.status).isEqualTo(403)
        assertThat(me.code).isEqualTo("common.forbidden")
    }
}
