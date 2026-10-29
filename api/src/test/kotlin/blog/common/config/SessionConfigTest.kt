package blog.common.config

import blog.Browser
import blog.TestcontainersConfiguration
import blog.domain.auth.FakeGitHub
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.web.server.LocalServerPort
import org.springframework.context.annotation.Import
import org.springframework.jdbc.core.simple.JdbcClient
import java.util.Base64

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Import(TestcontainersConfiguration::class, FakeGitHub.Config::class)
class SessionConfigTest(
    @LocalServerPort private val port: Int,
    @Autowired private val fakeGitHub: FakeGitHub,
    @Autowired private val jdbc: JdbcClient,
) {
    // What a session stored before a class moved looks like to the code after it.
    private fun corrupt(browser: Browser) {
        val sessionId = String(Base64.getDecoder().decode(checkNotNull(browser.cookie("blog_session"))))
        jdbc
            .sql(
                """
                update spring_session_attributes set attribute_bytes = '\x00'::bytea
                where session_primary_id = (select primary_id from spring_session where session_id = :id)
                """.trimIndent(),
            ).param("id", sessionId)
            .update()
    }

    @Test
    fun `a session that no longer reads signs the admin out instead of failing`() {
        val browser = Browser(port)
        fakeGitHub.signIn(browser)
        corrupt(browser)

        val me = browser.get("/api/admin/me")

        assertThat(me.status).isEqualTo(401)
        assertThat(me.code).isEqualTo("common.unauthorized")
    }

    @Test
    fun `signing in again with that cookie works`() {
        val browser = Browser(port)
        fakeGitHub.signIn(browser)
        corrupt(browser)
        browser.get("/api/admin/me")

        fakeGitHub.signIn(browser)

        assertThat(browser.get("/api/admin/me").status).isEqualTo(200)
    }
}
