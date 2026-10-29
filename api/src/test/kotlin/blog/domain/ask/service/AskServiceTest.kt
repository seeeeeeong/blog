package blog.domain.ask.service

import blog.MutableClock
import blog.ServerSentEvents
import blog.TestcontainersConfiguration
import blog.common.exception.BlogError
import blog.common.exception.BlogException
import blog.common.web.ClientIp
import blog.domain.ask.dto.request.AskRequest
import blog.domain.ask.dto.request.AskTurnRequest
import blog.domain.ask.entity.AskPrompt
import blog.domain.llm.FakeLlmGateway
import blog.domain.post.Posts
import blog.domain.post.repository.PostRepository
import blog.domain.post.repository.TopicRepository
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.jdbc.core.simple.JdbcClient
import java.time.Instant
import java.util.UUID

// Not @Transactional: the model must be asked outside any transaction.
@SpringBootTest
@Import(TestcontainersConfiguration::class, MutableClock.Config::class, FakeLlmGateway.Config::class)
class AskServiceTest(
    @Autowired private val askService: AskService,
    @Autowired private val fakeLlmGateway: FakeLlmGateway,
    @Autowired private val clock: MutableClock,
    @Autowired private val jdbc: JdbcClient,
    @Autowired postRepository: PostRepository,
    @Autowired topicRepository: TopicRepository,
) {
    private val posts = Posts(postRepository, topicRepository)
    private val reader = ClientIp("203.0.113.7")

    // Truncate fires no row trigger, so it clears the append-only rows as well; the api itself never does.
    @BeforeEach
    @AfterEach
    fun clear() {
        jdbc.sql("truncate ask_message, ask_daily_usage, llm_call, post_revision, post").update()
        fakeLlmGateway.reset()
        clock.reset()
    }

    private fun ask(
        request: AskRequest,
        ip: ClientIp = reader,
    ): ServerSentEvents {
        val recorder = ServerSentEvents.Recorder()
        askService.ask(request, ip, recorder.stream)
        return recorder.events()
    }

    private fun fails(
        error: BlogError,
        call: () -> Unit,
    ) {
        assertThatThrownBy(call).isInstanceOfSatisfying(BlogException::class.java) {
            assertThat(it.error).isEqualTo(error)
        }
    }

    private fun messages() =
        jdbc
            .sql("select role, content, grounded, post_id, conversation_id from ask_message order by role desc")
            .query { row, _ ->
                mapOf(
                    "role" to row.getString(1),
                    "content" to row.getString(2),
                    "grounded" to row.getObject(3),
                    "postId" to row.getObject(4),
                    "conversationId" to row.getObject(5),
                )
            }.list()

    private fun spent(
        purpose: String,
        micros: Long,
    ) {
        jdbc
            .sql(
                """
                insert into llm_call (id, purpose, model, input_tokens, output_tokens, cost_micros, created_at)
                values (gen_random_uuid(), :purpose, 'deepseek-flash', 0, 0, :micros, :at)
                """.trimIndent(),
            ).param("purpose", purpose)
            .param("micros", micros)
            .param("at", java.sql.Timestamp.from(clock.instant()))
            .update()
    }

    private fun counted() =
        jdbc.sql("select coalesce(sum(count), 0) from ask_daily_usage").query(Int::class.java).single()

    @Test
    fun `on a post, the answer comes from its body, names it as the source, and is logged without the reader`() {
        val post = posts.published(slug = "tcp-handshake")
        fakeLlmGateway.answers("GROUNDED: yes\nSOURCES: -\n\n세 번 주고받아요.\n순서 번호를 맞춰요.")

        val events = ask(AskRequest(postSlug = "tcp-handshake", question = " 왜 세 번인가요? "))

        assertThat(events.names).containsExactly("sources", "text", "text", "done")
        val sources = events.single("sources").get("posts")
        assertThat(sources.toList().map { it.get("slug").asString() to it.get("title").asString() })
            .containsExactly("tcp-handshake" to "제목 tcp-handshake")
        assertThat(events.text).isEqualTo("세 번 주고받아요.\n순서 번호를 맞춰요.")
        val done = events.single("done")
        assertThat(done.get("grounded").asBoolean()).isTrue()
        val asked = fakeLlmGateway.asked.single()
        assertThat(asked.user).contains("<post>\nTitle: 제목 tcp-handshake\n\n# tcp-handshake\n\n본문이다.\n</post>")
        assertThat(asked.user).endsWith("<question>\n왜 세 번인가요?\n</question>")
        assertThat(asked.maxTokens).isEqualTo(AskPrompt.MAX_TOKENS)
        assertThat(fakeLlmGateway.inTransaction).containsExactly(false)
        val conversation = UUID.fromString(done.get("conversationId").asString())
        assertThat(messages()).containsExactly(
            mapOf(
                "role" to "USER",
                "content" to "왜 세 번인가요?",
                "grounded" to null,
                "postId" to post.id,
                "conversationId" to conversation,
            ),
            mapOf(
                "role" to "ASSISTANT",
                "content" to "세 번 주고받아요.\n순서 번호를 맞춰요.",
                "grounded" to true,
                "postId" to post.id,
                "conversationId" to conversation,
            ),
        )
        assertThat(jdbc.sql("select purpose from llm_call").query(String::class.java).single()).isEqualTo("ASK")
        assertThat(jdbc.sql("select ip_hash from ask_daily_usage").query(String::class.java).single())
            .matches("[0-9a-f]{64}")
    }

    @Test
    fun `an answer the post does not hold says so first, names no source, and is marked not grounded`() {
        posts.published(slug = "tcp-handshake")
        fakeLlmGateway.answers("GROUNDED: no\nSOURCES: tcp-handshake\n\n일반적으로는 그렇습니다.")

        val events = ask(AskRequest(postSlug = "tcp-handshake", question = "QUIC 은요?"))

        assertThat(events.single("sources").get("posts").isEmpty).isTrue()
        assertThat(events.text).isEqualTo(AskPrompt.NOT_IN_POSTS + "일반적으로는 그렇습니다.")
        assertThat(
            events.events[1]
                .data
                .get("text")
                .asString(),
        ).isEqualTo(AskPrompt.NOT_IN_POSTS)
        assertThat(events.single("done").get("grounded").asBoolean()).isFalse()
        assertThat(messages().last()["grounded"]).isEqualTo(false)
        assertThat(messages().last()["content"] as String).startsWith("이 내용은 글에 없어요")
    }

    @Test
    fun `on the home page, published posts are listed and only listed ones become sources`() {
        posts.published(slug = "tcp-handshake")
        posts.published(slug = "b-tree", topic = "database")
        posts.draft("secret-draft", position = 2)
        fakeLlmGateway.answers("GROUNDED: yes\nSOURCES: b-tree, secret-draft, made-up\n\nB-Tree 글을 보세요.")

        val events = ask(AskRequest(question = "인덱스가 궁금해요"))

        val asked = fakeLlmGateway.asked.single().user
        assertThat(
            asked,
        ).contains("b-tree | 제목 b-tree | 요약 b-tree", "tcp-handshake | 제목 tcp-handshake | 요약 tcp-handshake")
        assertThat(asked).doesNotContain("secret-draft", "본문이다")
        val sources =
            events
                .single("sources")
                .get("posts")
                .toList()
                .map { it.get("slug").asString() }
        assertThat(sources).containsExactly("b-tree")
        assertThat(events.single("done").get("grounded").asBoolean()).isTrue()
        assertThat(messages().map { it["postId"] }).containsOnlyNulls()
    }

    @Test
    fun `on the home page, an answer that names no listed post is not grounded`() {
        posts.published(slug = "tcp-handshake")
        fakeLlmGateway.answers("GROUNDED: yes\nSOURCES: made-up\n\n그런 글은 없어요.")

        val events = ask(AskRequest(question = "Rust 는요?"))

        assertThat(events.single("sources").get("posts").isEmpty).isTrue()
        assertThat(events.text).startsWith(AskPrompt.NOT_IN_POSTS)
        assertThat(events.single("done").get("grounded").asBoolean()).isFalse()
    }

    @Test
    fun `the conversation goes on under its id, with only its latest turns sent`() {
        posts.published(slug = "tcp-handshake")
        val conversation = UUID.fromString("019a3000-0000-7000-8000-0000000000aa")
        val history = (1..8).map { AskTurnRequest(role = if (it % 2 == 1) "user" else "assistant", content = "턴 $it") }

        val events =
            ask(
                AskRequest(
                    postSlug = "tcp-handshake",
                    question = "그다음은요?",
                    history = history,
                    conversationId = conversation,
                ),
            )

        val asked = fakeLlmGateway.asked.single().user
        assertThat(asked).contains("<history>\n[reader]\n턴 3\n\n[you]\n턴 4")
        assertThat(asked).doesNotContain("턴 2\n")
        assertThat(events.single("done").get("conversationId").asString()).isEqualTo(conversation.toString())
        assertThat(messages().map { it["conversationId"] }).containsOnly(conversation)
    }

    @Test
    fun `a reader asks fifty questions a day, and the next day starts over`() {
        posts.published(slug = "tcp-handshake")
        // 23:59 on 29 October in Korea.
        clock.set(Instant.parse("2026-10-29T14:59:00Z"))
        val request = AskRequest(postSlug = "tcp-handshake", question = "질문")
        repeat(50) { ask(request) }

        fails(BlogError.ASK_DAILY_LIMIT_REACHED) { ask(request) }
        assertThat(fakeLlmGateway.asked).hasSize(50)
        assertThat(ask(request, ClientIp("198.51.100.4")).names.last()).isEqualTo("done")

        clock.set(Instant.parse("2026-10-29T15:00:00Z"))
        assertThat(ask(request).names.last()).isEqualTo("done")
        val days = jdbc.sql("select distinct day::text from ask_daily_usage").query(String::class.java).list()
        assertThat(days).containsExactly("2026-10-30")
    }

    @Test
    fun `at Ask's monthly cap nothing is asked or counted, and the editor's spending is not Ask's`() {
        posts.published(slug = "tcp-handshake")
        val request = AskRequest(postSlug = "tcp-handshake", question = "질문")
        spent(purpose = "MEMO", micros = 10_000_000)

        assertThat(ask(request).names.last()).isEqualTo("done")

        spent(purpose = "ASK", micros = 30_000_000)
        fails(BlogError.ASK_MONTHLY_CAP_REACHED) { ask(request) }
        assertThat(fakeLlmGateway.asked).hasSize(1)
        assertThat(counted()).isEqualTo(1)
    }

    @Test
    fun `without a key, or on a post that is not there, nothing is asked or counted`() {
        posts.published(slug = "tcp-handshake")
        fakeLlmGateway.configured = false

        fails(BlogError.ASK_UNAVAILABLE) { ask(AskRequest(postSlug = "tcp-handshake", question = "질문")) }
        fakeLlmGateway.configured = true
        fails(BlogError.POST_NOT_FOUND) { ask(AskRequest(postSlug = "missing", question = "질문")) }

        assertThat(fakeLlmGateway.asked).isEmpty()
        assertThat(counted()).isZero()
        assertThat(messages()).isEmpty()
    }

    @Test
    fun `a model that fails midway ends the stream with an error, and only the question is logged`() {
        posts.published(slug = "tcp-handshake")
        fakeLlmGateway.answers("GROUNDED: yes\nSOURCES: -\n\n첫 줄\n둘째 줄")
        fakeLlmGateway.failingMidway = BlogError.LLM_FAILED

        val events = ask(AskRequest(postSlug = "tcp-handshake", question = "질문"))

        assertThat(events.names.last()).isEqualTo("error")
        assertThat(events.single("error").get("code").asString()).isEqualTo("llm.failed")
        assertThat(messages().map { it["role"] }).containsExactly("USER")
    }
}
