package blog.domain.post.controller

import blog.Browser
import blog.Http
import blog.TestcontainersConfiguration
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.web.server.LocalServerPort
import org.springframework.context.annotation.Import

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Import(TestcontainersConfiguration::class)
class TopicControllerTest(
    @LocalServerPort private val port: Int,
) {
    private val http = Http(port)

    @Test
    fun `a reader lists the topics in their order`() {
        val topics = http.get("/api/topics")

        assertThat(topics.status).isEqualTo(200)
        assertThat(topics.body.toList().map { it.get("slug").asString() })
            .containsExactly("os", "network", "database", "algorithm", "spring")
        assertThat(topics.body.toList().map { it.get("title").asString() })
            .containsExactly("운영체제", "네트워크", "데이터베이스", "자료구조와 알고리즘", "Spring")
        assertThat(topics.body.toList().map { it.get("position").asInt() }).containsExactly(1, 2, 3, 4, 5)
    }

    @Test
    fun `nothing writes a topic over HTTP, even with the CSRF token`() {
        val browser = Browser(port)
        browser.fetchCsrf()

        listOf("POST", "PUT", "PATCH", "DELETE").forEach { method ->
            val answer = browser.send(method, "/api/topics", body = emptyMap<String, Any>())

            assertThat(answer.status).describedAs(method).isEqualTo(405)
        }
    }
}
