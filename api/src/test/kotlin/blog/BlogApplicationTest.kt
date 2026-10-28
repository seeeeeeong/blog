package blog

import com.linecorp.kotlinjdsl.render.jpql.JpqlRenderContext
import jakarta.persistence.EntityManager
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.web.server.LocalServerPort
import org.springframework.context.annotation.Import
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.time.Clock

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Import(TestcontainersConfiguration::class)
class BlogApplicationTest(
    @LocalServerPort private val port: Int,
    @Autowired private val clock: Clock,
    @Autowired private val entityManager: EntityManager,
    @Autowired private val jpql: JpqlRenderContext,
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
}
