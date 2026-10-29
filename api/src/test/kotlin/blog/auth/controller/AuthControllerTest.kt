package blog.auth.controller

import blog.Browser
import blog.TestcontainersConfiguration
import blog.auth.FakeGitHub
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.web.server.LocalServerPort
import org.springframework.context.annotation.Import
import org.springframework.jdbc.core.simple.JdbcClient
import java.net.URLDecoder
import java.util.Base64

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Import(TestcontainersConfiguration::class, FakeGitHub.Config::class)
class AuthControllerTest(
    @LocalServerPort private val port: Int,
    @Autowired private val fakeGitHub: FakeGitHub,
    @Autowired private val jdbc: JdbcClient,
) {
    private fun sessionIdOf(browser: Browser) =
        browser.cookie("blog_session")?.let { String(Base64.getDecoder().decode(it)) }

    private fun storedSessions(sessionId: String) =
        jdbc
            .sql("select count(*) from spring_session where session_id = :id")
            .param("id", sessionId)
            .query(Int::class.java)
            .single()

    @Test
    fun `sign-in sends the browser to GitHub, asking it to come back under api auth`() {
        val start = Browser(port).get("/api/auth/github")

        assertThat(start.status).isEqualTo(302)
        val location = URLDecoder.decode(start.location, Charsets.UTF_8)
        assertThat(location)
            .startsWith("${fakeGitHub.url}/login/oauth/authorize?")
            .contains("client_id=fake-client", "response_type=code", "state=")
            .contains("redirect_uri=http://localhost:3150/api/auth/github/callback")
    }

    @Test
    fun `the admin signs in with GitHub and lands on the admin page, signed in`() {
        val browser = Browser(port)

        val callback = fakeGitHub.signIn(browser)

        assertThat(callback.status).isEqualTo(302)
        assertThat(callback.location).isEqualTo("http://localhost:3150/admin")
        assertThat(browser.get("/api/admin/me").status).isEqualTo(200)
    }

    @Test
    fun `the session cookie is HttpOnly, Secure and SameSite=Lax, and lasts two weeks`() {
        val callback = fakeGitHub.signIn(Browser(port))

        assertThat(callback.setCookie("blog_session"))
            .contains("HttpOnly", "Secure", "SameSite=Lax", "Max-Age=1209600")
    }

    @Test
    fun `a signed-in session is stored as long as its cookie, and one left mid sign-in only briefly`() {
        val browser = Browser(port)
        browser.get("/api/auth/github")
        val started = checkNotNull(sessionIdOf(browser))
        val startedFor = maxInactiveInterval(started)

        fakeGitHub.signIn(browser)

        assertThat(startedFor).isEqualTo(600)
        assertThat(maxInactiveInterval(checkNotNull(sessionIdOf(browser)))).isEqualTo(1_209_600)
    }

    private fun maxInactiveInterval(sessionId: String) =
        jdbc
            .sql("select max_inactive_interval from spring_session where session_id = :id")
            .param("id", sessionId)
            .query(Int::class.java)
            .single()

    @Test
    fun `signing in starts a new session id, so one known before it is worth nothing`() {
        val browser = Browser(port)
        browser.get("/api/auth/github")
        val before = checkNotNull(sessionIdOf(browser))

        fakeGitHub.signIn(browser)

        assertThat(sessionIdOf(browser)).isNotNull().isNotEqualTo(before)
        assertThat(storedSessions(before)).isZero()
    }

    @Test
    fun `GitHub's login is matched without case`() {
        val callback = fakeGitHub.signIn(Browser(port), login = "SeeeeeeonG")

        assertThat(callback.location).isEqualTo("http://localhost:3150/admin")
    }

    @Test
    fun `anyone else is sent back with auth not_admin and keeps no session`() {
        val browser = Browser(port)
        browser.get("/api/auth/github")
        val started = checkNotNull(sessionIdOf(browser))

        val callback = fakeGitHub.signIn(browser, login = "stranger")

        assertThat(callback.status).isEqualTo(302)
        assertThat(callback.location).isEqualTo("http://localhost:3150/admin/login?error=auth.not_admin")
        assertThat(browser.cookie("blog_session")).isNull()
        assertThat(storedSessions(started)).isZero()
        assertThat(browser.get("/api/admin/me").status).isEqualTo(401)
    }

    @Test
    fun `a callback this browser did not start fails sign-in`() {
        val browser = Browser(port)

        val callback = browser.get("/api/auth/github/callback?code=fake-code&state=forged")

        assertThat(callback.status).isEqualTo(302)
        assertThat(callback.location).isEqualTo("http://localhost:3150/admin/login?error=auth.login_failed")
        assertThat(browser.cookie("blog_session")).isNull()
    }

    @Test
    fun `the CSRF token is a cookie the page can read, and asking for it stores no session`() {
        val browser = Browser(port)

        val csrf = browser.fetchCsrf()

        assertThat(csrf.status).isEqualTo(200)
        assertThat(csrf.body?.get("headerName")?.asString()).isEqualTo("X-XSRF-TOKEN")
        assertThat(csrf.body?.get("token")?.asString()).isEqualTo(browser.cookie("XSRF-TOKEN"))
        assertThat(csrf.setCookie("XSRF-TOKEN")).doesNotContain("HttpOnly").contains("SameSite=Lax", "Secure")
        assertThat(csrf.setCookie("blog_session")).isNull()
    }

    @Test
    fun `logging out needs the CSRF token, then ends the session`() {
        val browser = Browser(port)
        fakeGitHub.signIn(browser)
        browser.fetchCsrf()

        val forged = browser.send("POST", "/api/auth/logout", csrf = false)
        val logout = browser.post("/api/auth/logout")

        assertThat(forged.status).isEqualTo(403)
        assertThat(forged.code).isEqualTo("auth.invalid_csrf")
        assertThat(logout.status).isEqualTo(204)
        assertThat(browser.cookie("blog_session")).isNull()
        assertThat(browser.get("/api/admin/me").status).isEqualTo(401)
    }

    @Test
    fun `GET api auth paths other than github are not read as an OAuth client`() {
        val missing = Browser(port).get("/api/auth/gitlab")

        assertThat(missing.status).isEqualTo(404)
        assertThat(missing.code).isEqualTo("common.not_found")
    }
}
