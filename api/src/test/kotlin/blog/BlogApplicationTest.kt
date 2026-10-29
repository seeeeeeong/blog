package blog

import com.linecorp.kotlinjdsl.render.jpql.JpqlRenderContext
import jakarta.persistence.EntityManager
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.web.server.LocalServerPort
import org.springframework.context.annotation.Import
import org.springframework.web.bind.annotation.RequestMethod
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.time.Clock
import java.util.UUID

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Import(TestcontainersConfiguration::class)
class BlogApplicationTest(
    @LocalServerPort private val port: Int,
    @Autowired private val clock: Clock,
    @Autowired private val entityManager: EntityManager,
    @Autowired private val jpql: JpqlRenderContext,
    @Autowired @Qualifier("requestMappingHandlerMapping") private val routes: RequestMappingHandlerMapping,
) {
    private val client = HttpClient.newHttpClient()

    private fun get(path: String): HttpResponse<String> =
        client.send(
            HttpRequest.newBuilder(URI.create("http://127.0.0.1:$port$path")).build(),
            HttpResponse.BodyHandlers.ofString(),
        )

    @Test
    fun `the application starts against PostgreSQL with the clock and Kotlin JDSL wired`() {
        assertThat(clock).isNotNull()
        assertThat(entityManager.isOpen).isTrue()
        assertThat(jpql).isNotNull()
    }

    @Test
    fun `it answers its health over HTTP, and nothing more of it`() {
        val health = get("/actuator/health")

        assertThat(health.statusCode()).isEqualTo(200)
        assertThat(health.body()).contains("\"status\":\"UP\"").doesNotContain("components", "db")
    }

    @Test
    fun `a path nothing serves answers a 404 in the error body`() {
        val missing = get("/api/missing")

        assertThat(missing.statusCode()).isEqualTo(404)
        assertThat(missing.body()).contains("\"code\":\"common.not_found\"")
    }

    private val api
        get() = routes.handlerMethods.keys.filter { route -> route.patternValues.any { it.startsWith("/api/") } }

    private fun isGuarded(pattern: String) = pattern.startsWith("/api/admin/") || pattern.startsWith("/api/auth/")

    // A reader's one write: a question, which carries the page's CSRF token like any other write.
    private val readerWrites = setOf("/api/ask")

    @Test
    fun `public api routes only read, and only admin, auth and a reader's question write`() {
        val (guarded, public) = api.partition { route -> route.patternValues.all(::isGuarded) }
        val (writes, reads) = public.partition { route -> route.patternValues.all { it in readerWrites } }

        assertThat(reads).isNotEmpty()
        assertThat(reads).allSatisfy { assertThat(it.methodsCondition.methods).containsExactly(RequestMethod.GET) }
        assertThat(writes.flatMap { it.patternValues }).containsExactlyInAnyOrderElementsOf(readerWrites)
        assertThat(writes).allSatisfy { assertThat(it.methodsCondition.methods).containsExactly(RequestMethod.POST) }
        assertThat(guarded).allSatisfy { assertThat(it.methodsCondition.methods).isNotEmpty() }
    }

    @Test
    fun `a reader's question, like every write, needs the CSRF token`() {
        val browser = Browser(port)
        browser.fetchCsrf()

        val forged = browser.send(method = "POST", path = "/api/ask", body = mapOf("question" to "질문"), csrf = false)

        assertThat(forged.status).isEqualTo(403)
        assertThat(forged.code).isEqualTo("auth.invalid_csrf")
    }

    @Test
    fun `every admin route needs the admin's session, and a write the CSRF token before that`() {
        val admin = api.filter { route -> route.patternValues.all { it.startsWith("/api/admin/") } }

        assertThat(admin).isNotEmpty()
        admin.forEach { route ->
            route.patternValues.forEach { pattern ->
                val path = pattern.replace(Regex("\\{[^}]+}"), UUID.randomUUID().toString())
                route.methodsCondition.methods.forEach { method -> assertGuarded(method.name, path) }
            }
        }
    }

    private fun assertGuarded(
        method: String,
        path: String,
    ) {
        val browser = Browser(port)
        browser.fetchCsrf()
        if (method != "GET") {
            val forged = browser.send(method = method, path = path, body = emptyMap<String, Any>(), csrf = false)
            assertThat(forged.status).describedAs("$method $path without CSRF").isEqualTo(403)
            assertThat(forged.code).isEqualTo("auth.invalid_csrf")
        }
        val anonymous = browser.send(method, path, body = emptyMap<String, Any>().takeIf { method != "GET" })
        assertThat(anonymous.status).describedAs("$method $path without a session").isEqualTo(401)
        assertThat(anonymous.code).isEqualTo("common.unauthorized")
    }
}
