package blog.domain.book.controller

import blog.Browser
import blog.Http
import blog.TestcontainersConfiguration
import blog.domain.auth.FakeGitHub
import blog.domain.book.FakeBookSourceGateway
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
class BookControllerTest(
    @LocalServerPort private val port: Int,
    @Autowired private val fakeGitHub: FakeGitHub,
    @Autowired private val fakeBookSourceGateway: FakeBookSourceGateway,
    @Autowired private val jdbc: JdbcClient,
) {
    private val reader = Http(port)
    private lateinit var admin: Browser
    private lateinit var book: JsonNode

    @BeforeEach
    fun importBook() {
        jdbc.sql("truncate study_note, ask_message, post_revision, post, book_section, book").update()
        fakeBookSourceGateway.reset()
        fakeBookSourceGateway.holds("74219491")
        admin = Browser(port)
        fakeGitHub.signIn(admin)
        admin.fetchCsrf()
        book =
            checkNotNull(admin.post("/api/admin/books", mapOf("sourceRef" to "74219491", "topicSlug" to "spring")).body)
    }

    private fun JsonNode.text(field: String): String = get(field).asString()

    private fun section(
        chapter: Int,
        section: Int,
    ) = book
        .get("chapters")
        .get(chapter)
        .get("sections")
        .get(section)
        .text("id")

    private fun publish(section: String) {
        val draft = checkNotNull(admin.post("/api/admin/sections/$section/post").body)
        admin.post(
            "/api/admin/posts/${draft.text("id")}/publish",
            mapOf(
                "version" to draft.get("version").asLong(),
                "title" to draft.text("title"),
                "slug" to "ticket",
                "topicSlug" to "spring",
                "position" to draft.get("position").asInt(),
                "summary" to "티켓 판매로 보는 객체",
                "bodyMdx" to "# 티켓",
            ),
        )
    }

    @Test
    fun `a reader sees each book with its progress, counting published posts only`() {
        publish(section(chapter = 0, section = 0))
        admin.post("/api/admin/sections/${section(chapter = 0, section = 1)}/post")

        val list = reader.get("/api/books")

        assertThat(list.status).isEqualTo(200)
        val listed = list.body.single()
        assertThat(listed.text("title")).isEqualTo("오브젝트")
        assertThat(listed.text("sourceUrl")).isEqualTo("https://www.yes24.com/product/goods/74219491")
        assertThat(listed.get("writtenSections").asInt()).isEqualTo(1)
        assertThat(listed.get("totalSections").asInt()).isEqualTo(3)
        assertThat(listed.has("sourceRef")).isFalse()
    }

    @Test
    fun `a reader sees the contents, a section linked only to a published post`() {
        publish(section(chapter = 0, section = 0))
        admin.post("/api/admin/sections/${section(chapter = 0, section = 1)}/post")

        val shown = reader.get("/api/books/${book.text("id")}")

        assertThat(shown.status).isEqualTo(200)
        val sections =
            shown.body
                .get("chapters")
                .first()
                .get("sections")
        assertThat(sections.values().map { it.text("number") }).containsExactly("1.1", "1.2")
        val linked = sections.first().get("post")
        assertThat(linked.text("slug")).isEqualTo("ticket")
        assertThat(linked.text("summary")).isEqualTo("티켓 판매로 보는 객체")
        assertThat(linked.has("status")).isFalse()
        assertThat(sections.get(1).get("post").isNull).isTrue()
        assertThat(shown.body.toString()).doesNotContain("DRAFT")
    }

    @Test
    fun `an unknown book is not found`() {
        val missing = reader.get("/api/books/019a3000-0000-7000-8000-00000000ffff")

        assertThat(missing.status).isEqualTo(404)
        assertThat(missing.code).isEqualTo("book.not_found")
    }
}
