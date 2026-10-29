package blog.book.controller

import blog.Browser
import blog.TestcontainersConfiguration
import blog.auth.FakeGitHub
import blog.book.FakeBookSourceGateway
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.web.server.LocalServerPort
import org.springframework.context.annotation.Import
import org.springframework.jdbc.core.simple.JdbcClient
import tools.jackson.databind.JsonNode

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Import(TestcontainersConfiguration::class, FakeGitHub.Config::class, FakeBookSourceGateway.Config::class)
class AdminSectionControllerTest(
    @LocalServerPort private val port: Int,
    @Autowired private val fakeGitHub: FakeGitHub,
    @Autowired private val fakeBookSourceGateway: FakeBookSourceGateway,
    @Autowired private val jdbc: JdbcClient,
) {
    private lateinit var admin: Browser

    @BeforeEach
    fun signIn() {
        jdbc.sql("truncate post_revision, post, book_section, book").update()
        fakeBookSourceGateway.reset()
        fakeBookSourceGateway.holds("74219491")
        admin = Browser(port)
        fakeGitHub.signIn(admin)
        admin.fetchCsrf()
    }

    private fun JsonNode.text(field: String): String = get(field).asString()

    private fun firstSection(topicSlug: String? = "spring"): String {
        val book = admin.post("/api/admin/books", mapOf("sourceRef" to "74219491", "topicSlug" to topicSlug))
        return checkNotNull(book.body)
            .get("chapters")
            .first()
            .get("sections")
            .first()
            .text("id")
    }

    @Test
    fun `writing a post creates a draft for the section once, then returns it`() {
        val section = firstSection()

        val created = admin.post("/api/admin/sections/$section/post")
        val again = admin.post("/api/admin/sections/$section/post")
        val book = checkNotNull(admin.get("/api/admin/books").body).single()

        assertThat(created.status).isEqualTo(201)
        val post = checkNotNull(created.body)
        assertThat(post.text("status")).isEqualTo("DRAFT")
        assertThat(post.text("title")).isEqualTo("티켓 판매")
        assertThat(post.text("sectionId")).isEqualTo(section)
        assertThat(post.get("topic").text("slug")).isEqualTo("spring")
        assertThat(post.has("version")).isTrue()
        assertThat(again.status).isEqualTo(200)
        assertThat(again.body?.text("id")).isEqualTo(post.text("id"))
        val linked =
            book
                .get("chapters")
                .first()
                .get("sections")
                .first()
                .get("post")
        assertThat(linked.text("id")).isEqualTo(post.text("id"))
        assertThat(linked.text("status")).isEqualTo("DRAFT")
        assertThat(admin.get("/api/admin/posts/${post.text("id")}").body?.text("sectionId")).isEqualTo(section)
    }

    @Test
    fun `a book without a topic asks for one first`() {
        val section = firstSection(topicSlug = null)

        val refused = admin.post("/api/admin/sections/$section/post")

        assertThat(refused.status).isEqualTo(409)
        assertThat(refused.code).isEqualTo("book.topic_required")
        assertThat(refused.body?.text("message")).isEqualTo("글을 쓰려면 먼저 책의 주제를 정해 주세요")
    }

    @Test
    fun `an unknown section is not found`() {
        val missing = admin.post("/api/admin/sections/019a3000-0000-7000-8000-00000000ffff/post")

        assertThat(missing.status).isEqualTo(404)
        assertThat(missing.code).isEqualTo("book.section_not_found")
    }
}
