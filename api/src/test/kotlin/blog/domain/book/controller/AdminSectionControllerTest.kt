package blog.domain.book.controller

import blog.Browser
import blog.TestcontainersConfiguration
import blog.common.exception.BlogError
import blog.domain.auth.FakeGitHub
import blog.domain.book.FakeBookSourceGateway
import blog.domain.llm.FakeLlmGateway
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
@Import(
    TestcontainersConfiguration::class,
    FakeGitHub.Config::class,
    FakeBookSourceGateway.Config::class,
    FakeLlmGateway.Config::class,
)
class AdminSectionControllerTest(
    @LocalServerPort private val port: Int,
    @Autowired private val fakeGitHub: FakeGitHub,
    @Autowired private val fakeBookSourceGateway: FakeBookSourceGateway,
    @Autowired private val fakeLlmGateway: FakeLlmGateway,
    @Autowired private val jdbc: JdbcClient,
) {
    private lateinit var admin: Browser

    @BeforeEach
    fun signIn() {
        jdbc.sql("truncate llm_call, study_note, ask_message, post_revision, post, book_section, book").update()
        fakeBookSourceGateway.reset()
        fakeLlmGateway.reset()
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
        val noNote = admin.post("/api/admin/sections/019a3000-0000-7000-8000-00000000ffff/note")

        assertThat(missing.status).isEqualTo(404)
        assertThat(missing.code).isEqualTo("book.section_not_found")
        assertThat(noNote.status).isEqualTo(404)
        assertThat(noNote.code).isEqualTo("book.section_not_found")
    }

    @Test
    fun `the admin writes a section's study note, reads it back, and sees it on the book`() {
        val section = firstSection()

        val written = admin.post("/api/admin/sections/$section/note")
        val read = admin.get("/api/admin/sections/$section/note")
        val book = checkNotNull(admin.get("/api/admin/books").body).single()

        assertThat(written.status).isEqualTo(200)
        assertThat(written.contentType).startsWith("text/event-stream")
        assertThat(written.events.text).isEqualTo(FakeLlmGateway.REPLY.text)
        assertThat(written.events.names.last()).isEqualTo("done")
        val note = written.events.single("done")
        assertThat(note.text("sectionId")).isEqualTo(section)
        assertThat(note.text("bodyMdx")).isEqualTo(FakeLlmGateway.REPLY.text)
        assertThat(note.text("model")).isEqualTo("deepseek-flash")
        assertThat(note.get("inputTokens").asInt()).isEqualTo(1_000)
        assertThat(note.get("outputTokens").asInt()).isEqualTo(2_000)
        assertThat(read.status).isEqualTo(200)
        assertThat(read.body).isEqualTo(note)
        val sections = book.get("chapters").first().get("sections")
        assertThat(sections.first().text("noteCreatedAt")).isEqualTo(note.text("createdAt"))
        assertThat(sections.last().get("noteCreatedAt").isNull).isTrue()
    }

    @Test
    fun `a section without a note has none to read`() {
        val section = firstSection()

        val missing = admin.get("/api/admin/sections/$section/note")

        assertThat(missing.status).isEqualTo(404)
        assertThat(missing.code).isEqualTo("book.note_not_found")
        assertThat(missing.body?.text("message")).isEqualTo("아직 공부 노트가 없습니다")
    }

    @Test
    fun `without a key, or past the month's cap, no note is written`() {
        val section = firstSection()
        fakeLlmGateway.configured = false

        val off = admin.post("/api/admin/sections/$section/note")

        fakeLlmGateway.configured = true
        jdbc
            .sql(
                """
                insert into llm_call (id, purpose, model, input_tokens, output_tokens, cost_micros, created_at)
                values (gen_random_uuid(), 'MEMO', 'deepseek-flash', 0, 0, 10000000, now())
                """.trimIndent(),
            ).update()
        val capped = admin.post("/api/admin/sections/$section/note")

        assertThat(off.status).isEqualTo(503)
        assertThat(off.code).isEqualTo("llm.unavailable")
        assertThat(capped.status).isEqualTo(429)
        assertThat(capped.code).isEqualTo("llm.monthly_cap_reached")
        assertThat(admin.get("/api/admin/sections/$section/note").status).isEqualTo(404)
        assertThat(fakeLlmGateway.asked).isEmpty()
    }

    @Test
    fun `a model that fails ends the stream with an error event, and no note is saved`() {
        val section = firstSection()
        fakeLlmGateway.failing = BlogError.LLM_FAILED

        val failed = admin.post("/api/admin/sections/$section/note")

        assertThat(failed.status).isEqualTo(200)
        assertThat(failed.events.names).containsExactly("error")
        assertThat(failed.events.single("error").text("code")).isEqualTo("llm.failed")
        assertThat(admin.get("/api/admin/sections/$section/note").status).isEqualTo(404)
    }
}
