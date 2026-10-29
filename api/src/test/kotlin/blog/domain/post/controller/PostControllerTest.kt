package blog.domain.post.controller

import blog.Browser
import blog.Http
import blog.TestcontainersConfiguration
import blog.domain.post.Posts
import blog.domain.post.repository.PostRepository
import blog.domain.post.repository.TopicRepository
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.web.server.LocalServerPort
import org.springframework.context.annotation.Import
import java.time.Instant

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Import(TestcontainersConfiguration::class)
class PostControllerTest(
    @LocalServerPort private val port: Int,
    @Autowired postRepository: PostRepository,
    @Autowired topicRepository: TopicRepository,
) {
    private val http = Http(port)
    private val posts = Posts(postRepository, topicRepository)

    // Requests commit, and the context's database outlives a test.
    @BeforeEach
    fun clear() {
        posts.clear()
    }

    @Test
    fun `a reader lists published posts, the newest first, each numbered within its topic`() {
        posts.published(
            slug = "tcp-handshake",
            topic = "network",
            position = 1,
            at = Instant.parse("2026-10-01T00:00:00Z"),
        )
        posts.published(slug = "process", topic = "os", position = 2, at = Instant.parse("2026-10-02T09:30:00Z"))

        val list = http.get("/api/posts")

        assertThat(list.status).isEqualTo(200)
        assertThat(list.body.toList().map { it.get("slug").asString() }).containsExactly("process", "tcp-handshake")
        val newest = list.body.get(0)
        assertThat(newest.get("title").asString()).isEqualTo("제목 process")
        assertThat(newest.get("summary").asString()).isEqualTo("요약 process")
        assertThat(newest.get("number").asString()).isEqualTo("1.2")
        assertThat(newest.get("publishedAt").asString()).isEqualTo("2026-10-02T09:30:00Z")
        assertThat(newest.get("topic").get("slug").asString()).isEqualTo("os")
        assertThat(newest.get("topic").get("title").asString()).isEqualTo("운영체제")
        assertThat(newest.has("bodyMdx")).isFalse()
    }

    @Test
    fun `a reader reads a published post with its body`() {
        posts.published(slug = "tcp-handshake", topic = "network", position = 1)

        val post = http.get("/api/posts/tcp-handshake")

        assertThat(post.status).isEqualTo(200)
        assertThat(post.body.get("number").asString()).isEqualTo("2.1")
        assertThat(post.body.get("bodyMdx").asString()).isEqualTo("# tcp-handshake\n\n본문이다.")
        assertThat(
            post.body
                .get("topic")
                .get("slug")
                .asString(),
        ).isEqualTo("network")
    }

    @Test
    fun `a post names its previous and next post in the topic, or null at either end`() {
        posts.published(slug = "osi", topic = "network", position = 1, at = Instant.parse("2026-09-01T00:00:00Z"))
        posts.published(slug = "tcp-handshake", topic = "network", position = 2)
        posts.draft("udp", topic = "network", position = 3)

        val post = http.get("/api/posts/tcp-handshake")

        val previous = post.body.get("previous")
        assertThat(previous.get("slug").asString()).isEqualTo("osi")
        assertThat(previous.get("title").asString()).isEqualTo("제목 osi")
        assertThat(previous.get("number").asString()).isEqualTo("2.1")
        assertThat(previous.get("publishedAt").asString()).isEqualTo("2026-09-01T00:00:00Z")
        assertThat(previous.get("topic").get("slug").asString()).isEqualTo("network")
        assertThat(previous.has("bodyMdx")).isFalse()
        assertThat(post.body.get("next").isNull).isTrue()
    }

    @Test
    fun `a draft is neither listed nor read`() {
        posts.published(slug = "tcp-handshake", topic = "network", position = 1)
        posts.draft("udp", topic = "network", position = 2)

        val list = http.get("/api/posts")
        val draft = http.get("/api/posts/udp")

        assertThat(list.body.toList().map { it.get("slug").asString() }).containsExactly("tcp-handshake")
        assertThat(draft.status).isEqualTo(404)
        assertThat(draft.code).isEqualTo("post.not_found")
        assertThat(draft.body.toString()).doesNotContain("본문이다")
    }

    @Test
    fun `an unknown slug is not found, in Korean`() {
        val missing = http.get("/api/posts/missing")

        assertThat(missing.status).isEqualTo(404)
        assertThat(missing.code).isEqualTo("post.not_found")
        assertThat(missing.body.get("message").asString()).isEqualTo("글을 찾을 수 없습니다")
    }

    @Test
    fun `nothing writes a post over HTTP, even with the CSRF token`() {
        posts.draft("udp")
        val browser = Browser(port)
        browser.fetchCsrf()

        listOf("POST", "PUT", "PATCH", "DELETE").forEach { method ->
            listOf("/api/posts", "/api/posts/udp").forEach { path ->
                val answer = browser.send(method, path, body = emptyMap<String, Any>())

                assertThat(answer.status).describedAs("$method $path").isEqualTo(405)
                assertThat(answer.code).isEqualTo("common.method_not_allowed")
            }
        }
        assertThat(http.get("/api/posts/udp").status).isEqualTo(404)
    }
}
