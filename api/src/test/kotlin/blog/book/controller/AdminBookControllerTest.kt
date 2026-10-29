package blog.book.controller

import blog.Browser
import blog.TestcontainersConfiguration
import blog.auth.FakeGitHub
import blog.book.FakeBookSourceGateway
import blog.common.exception.BlogError
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
class AdminBookControllerTest(
    @LocalServerPort private val port: Int,
    @Autowired private val fakeGitHub: FakeGitHub,
    @Autowired private val fakeBookSourceGateway: FakeBookSourceGateway,
    @Autowired private val jdbc: JdbcClient,
) {
    private lateinit var admin: Browser

    @BeforeEach
    fun signIn() {
        jdbc.sql("truncate study_note, post_revision, post, book_section, book").update()
        fakeBookSourceGateway.reset()
        fakeBookSourceGateway.holds("74219491")
        admin = Browser(port)
        fakeGitHub.signIn(admin)
        admin.fetchCsrf()
    }

    private fun JsonNode.text(field: String): String = get(field).asString()

    private fun import(topicSlug: String? = "spring") =
        admin.post("/api/admin/books", mapOf("sourceRef" to "74219491", "topicSlug" to topicSlug))

    @Test
    fun `the admin searches YES24 and picks an edition to import`() {
        val found = admin.get("/api/admin/books/search?q=%EC%98%A4%EB%B8%8C%EC%A0%9D%ED%8A%B8")

        assertThat(found.status).isEqualTo(200)
        val edition = checkNotNull(found.body).single()
        assertThat(edition.text("sourceRef")).isEqualTo("74219491")
        assertThat(edition.text("sourceUrl")).isEqualTo("https://www.yes24.com/product/goods/74219491")
        assertThat(edition.text("title")).isEqualTo("오브젝트")
        assertThat(edition.text("isbn13")).isEqualTo("9788998139766")
        assertThat(edition.text("publishedOn")).isEqualTo("2019-06-17")
        assertThat(edition.get("hasContents").asBoolean()).isTrue()
        assertThat(edition.get("imported").asBoolean()).isFalse()
        assertThat(fakeBookSourceGateway.asked).containsExactly("오브젝트")
    }

    @Test
    fun `an import answers 201 with the book and its contents, and a second one 409`() {
        val imported = import()
        val again = import()

        assertThat(imported.status).isEqualTo(201)
        val book = checkNotNull(imported.body)
        assertThat(book.text("title")).isEqualTo("오브젝트")
        assertThat(book.get("topic").text("slug")).isEqualTo("spring")
        val chapter = book.get("chapters").first()
        assertThat(chapter.text("number")).isEqualTo("1")
        assertThat(chapter.text("title")).isEqualTo("객체, 설계")
        assertThat(chapter.get("post").isNull).isTrue()
        assertThat(chapter.get("sections").values().map { it.text("number") }).containsExactly("1.1", "1.2")
        assertThat(again.status).isEqualTo(409)
        assertThat(again.code).isEqualTo("book.already_imported")
    }

    @Test
    fun `the admin lists and reads the books, and sets one's topic`() {
        val id = checkNotNull(import(topicSlug = null).body).text("id")

        val list = admin.get("/api/admin/books")
        val placed = admin.put("/api/admin/books/$id/topic", mapOf("topicSlug" to "os"))
        val one = admin.get("/api/admin/books/$id")

        assertThat(checkNotNull(list.body).single().text("id")).isEqualTo(id)
        assertThat(checkNotNull(list.body).single().get("topic").isNull).isTrue()
        assertThat(placed.status).isEqualTo(200)
        assertThat(one.body?.get("topic")?.text("slug")).isEqualTo("os")
    }

    @Test
    fun `a blank search, a malformed reference and an unknown book are refused`() {
        val blank = admin.get("/api/admin/books/search?q=%20")
        val none = admin.get("/api/admin/books/search")
        val malformed = admin.post("/api/admin/books", mapOf("sourceRef" to "abc"))
        val missing = admin.get("/api/admin/books/019a3000-0000-7000-8000-00000000ffff")

        listOf(blank, none, malformed).forEach {
            assertThat(it.status).isEqualTo(400)
            assertThat(it.code).isEqualTo("common.invalid_input")
        }
        assertThat(missing.status).isEqualTo(404)
        assertThat(missing.code).isEqualTo("book.not_found")
        assertThat(fakeBookSourceGateway.asked).isEmpty()
    }

    @Test
    fun `a YES24 that fails answers with its own code`() {
        fakeBookSourceGateway.failing = BlogError.BOOK_SOURCE_FAILED

        val failed = admin.get("/api/admin/books/search?q=book")

        assertThat(failed.status).isEqualTo(502)
        assertThat(failed.code).isEqualTo("book.source_failed")
    }

    @Test
    fun `a reader without a session gets 401`() {
        val reader = Browser(port)
        reader.fetchCsrf()

        assertThat(reader.get("/api/admin/books").status).isEqualTo(401)
        assertThat(reader.post("/api/admin/books", mapOf("sourceRef" to "74219491")).status).isEqualTo(401)
        assertThat(fakeBookSourceGateway.asked).isEmpty()
    }
}
