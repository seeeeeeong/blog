package blog.post.controller

import blog.Browser
import blog.TestcontainersConfiguration
import blog.auth.FakeGitHub
import blog.llm.FakeLlmGateway
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
@Import(TestcontainersConfiguration::class, FakeGitHub.Config::class, FakeLlmGateway.Config::class)
class AdminPostControllerTest(
    @LocalServerPort private val port: Int,
    @Autowired private val fakeGitHub: FakeGitHub,
    @Autowired private val fakeLlmGateway: FakeLlmGateway,
    @Autowired private val jdbc: JdbcClient,
) {
    private lateinit var admin: Browser

    // Requests commit, and the context's database outlives a test. Truncate fires no row trigger,
    // so it clears the append-only revisions as well; the api itself never does.
    @BeforeEach
    fun signIn() {
        jdbc.sql("truncate llm_call, post_revision, post").update()
        fakeLlmGateway.reset()
        admin = Browser(port)
        fakeGitHub.signIn(admin)
        admin.fetchCsrf()
    }

    private fun JsonNode.text(field: String): String = get(field).asString()

    private fun draft(title: String = "TCP 3-way handshake"): JsonNode {
        val created = admin.post("/api/admin/posts", mapOf("title" to title, "topicSlug" to "network"))
        assertThat(created.status).isEqualTo(201)
        return checkNotNull(created.body)
    }

    private fun edit(
        post: JsonNode,
        summary: String = "연결을 여는 세 번의 왕복",
        slug: String = post.text("slug"),
    ) = mapOf(
        "version" to post.get("version").asLong(),
        "title" to post.text("title"),
        "slug" to slug,
        "topicSlug" to "network",
        "position" to post.get("position").asInt(),
        "summary" to summary,
        "bodyMdx" to "# TCP\n\n본문",
    )

    @Test
    fun `the admin creates a draft, saves it, publishes it, and readers then see it`() {
        val draft = draft()
        val id = draft.text("id")

        val saved = admin.put("/api/admin/posts/$id", edit(draft))
        val published = admin.post("/api/admin/posts/$id/publish", edit(checkNotNull(saved.body)))
        val read = admin.get("/api/posts/tcp-3-way-handshake")

        assertThat(draft.text("status")).isEqualTo("DRAFT")
        assertThat(draft.text("slug")).isEqualTo("tcp-3-way-handshake")
        assertThat(draft.text("number")).isEqualTo("2.1")
        assertThat(saved.status).isEqualTo(200)
        assertThat(saved.body.text("summary")).isEqualTo("연결을 여는 세 번의 왕복")
        assertThat(published.status).isEqualTo(200)
        assertThat(published.body?.text("status")).isEqualTo("PUBLISHED")
        assertThat(published.body?.get("publishedAt")?.isNull).isFalse()
        assertThat(read.status).isEqualTo(200)
        assertThat(read.body?.text("bodyMdx")).isEqualTo("# TCP\n\n본문")
    }

    @Test
    fun `a draft stays hidden from readers but is listed and read by the admin`() {
        val id = draft().text("id")

        val list = admin.get("/api/admin/posts")
        val one = admin.get("/api/admin/posts/$id")

        assertThat(admin.get("/api/posts/tcp-3-way-handshake").status).isEqualTo(404)
        assertThat(list.status).isEqualTo(200)
        val listed = checkNotNull(list.body).single()
        assertThat(listed.text("status")).isEqualTo("DRAFT")
        assertThat(listed.text("number")).isEqualTo("2.1")
        assertThat(listed.has("updatedAt")).isTrue()
        assertThat(listed.has("bodyMdx")).isFalse()
        assertThat(one.body?.text("bodyMdx")).isEmpty()
    }

    @Test
    fun `publishing without a summary is refused with its own code`() {
        val draft = draft()

        val refused = admin.post("/api/admin/posts/${draft.text("id")}/publish", edit(draft, summary = ""))

        assertThat(refused.status).isEqualTo(400)
        assertThat(refused.code).isEqualTo("post.summary_required")
        assertThat(refused.body?.text("message")).isEqualTo("발행하려면 요약을 적어 주세요")
    }

    @Test
    fun `a save from a stale version answers 409`() {
        val draft = draft()
        admin.put("/api/admin/posts/${draft.text("id")}", edit(draft))

        val stale = admin.put("/api/admin/posts/${draft.text("id")}", edit(draft))

        assertThat(stale.status).isEqualTo(409)
        assertThat(stale.code).isEqualTo("post.edit_conflict")
    }

    @Test
    fun `a slug that is not lowercase words joined by hyphens is invalid input`() {
        val draft = draft()

        val badSave = admin.put("/api/admin/posts/${draft.text("id")}", edit(draft, slug = "TCP Handshake"))
        val badCreate =
            admin.post("/api/admin/posts", mapOf("title" to "제목", "topicSlug" to "network", "slug" to "a--b"))
        val noTitle = admin.post("/api/admin/posts", mapOf("title" to " ", "topicSlug" to "network"))

        listOf(badSave, badCreate, noTitle).forEach {
            assertThat(it.status).isEqualTo(400)
            assertThat(it.code).isEqualTo("common.invalid_input")
        }
    }

    @Test
    fun `an unknown or malformed id answers 404 or 400`() {
        val missing = admin.get("/api/admin/posts/019a3000-0000-7000-8000-00000000ffff")
        val malformed = admin.get("/api/admin/posts/not-a-uuid")

        assertThat(missing.status).isEqualTo(404)
        assertThat(missing.code).isEqualTo("post.not_found")
        assertThat(malformed.status).isEqualTo(400)
    }

    @Test
    fun `a write without the CSRF header is refused even for the admin`() {
        val forged =
            admin.send(
                method = "POST",
                path = "/api/admin/posts",
                body = mapOf("title" to "제목", "topicSlug" to "network"),
                csrf = false,
            )

        assertThat(forged.status).isEqualTo(403)
        assertThat(forged.code).isEqualTo("auth.invalid_csrf")
        assertThat(checkNotNull(admin.get("/api/admin/posts").body).isEmpty).isTrue()
    }

    @Test
    fun `a reader without a session gets 401 from every admin post route`() {
        val reader = Browser(port)
        reader.fetchCsrf()

        val list = reader.get("/api/admin/posts")
        val create = reader.post("/api/admin/posts", mapOf("title" to "제목", "topicSlug" to "network"))

        assertThat(list.status).isEqualTo(401)
        assertThat(create.status).isEqualTo(401)
        assertThat(create.code).isEqualTo("common.unauthorized")
    }

    @Test
    fun `a memo comes back as a body for the draft, which stays as it was until the admin saves`() {
        val draft = draft()
        val id = draft.text("id")

        val written = admin.post("/api/admin/posts/$id/draft", mapOf("memo" to "SYN, SYN-ACK, ACK 순서"))
        val kept = admin.get("/api/admin/posts/$id")

        assertThat(written.status).isEqualTo(200)
        val body = checkNotNull(written.body)
        assertThat(body.text("bodyMdx")).isEqualTo(FakeLlmGateway.REPLY.text)
        assertThat(body.get("usedNote").asBoolean()).isFalse()
        assertThat(body.text("model")).isEqualTo("deepseek-flash")
        assertThat(body.get("inputTokens").asInt()).isEqualTo(1_000)
        assertThat(body.get("outputTokens").asInt()).isEqualTo(2_000)
        assertThat(kept.body?.text("bodyMdx")).isEmpty()
        assertThat(kept.body?.get("version")?.asLong()).isEqualTo(draft.get("version").asLong())
    }

    @Test
    fun `only a draft is written from a memo`() {
        val draft = draft()
        val id = draft.text("id")
        admin.post("/api/admin/posts/$id/publish", edit(draft))

        val refused = admin.post("/api/admin/posts/$id/draft", mapOf("memo" to "메모"))

        assertThat(refused.status).isEqualTo(409)
        assertThat(refused.code).isEqualTo("post.not_draft")
        assertThat(fakeLlmGateway.asked).isEmpty()
    }

    @Test
    fun `a blank or overlong memo is invalid input`() {
        val id = draft().text("id")

        val blank = admin.post("/api/admin/posts/$id/draft", mapOf("memo" to " "))
        val long = admin.post("/api/admin/posts/$id/draft", mapOf("memo" to "가".repeat(20_001)))

        assertThat(blank.status).isEqualTo(400)
        assertThat(long.status).isEqualTo(400)
        assertThat(long.code).isEqualTo("common.invalid_input")
        assertThat(fakeLlmGateway.asked).isEmpty()
    }
}
