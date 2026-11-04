package blog.domain.post.service

import blog.ServerSentEvents
import blog.TestcontainersConfiguration
import blog.common.exception.BlogError
import blog.common.exception.BlogException
import blog.domain.llm.FakeLlmGateway
import blog.domain.post.dto.request.PostCreateRequest
import blog.domain.post.dto.request.PostDraftRequest
import blog.domain.post.dto.request.PostSaveRequest
import blog.domain.post.dto.response.AdminPostResponse
import blog.domain.post.dto.response.PostDraftResponse
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.jdbc.core.simple.JdbcClient
import java.util.UUID

// Not @Transactional: the model must be asked outside any transaction.
@SpringBootTest
@Import(TestcontainersConfiguration::class, FakeLlmGateway.Config::class)
class PostDraftServiceTest(
    @Autowired private val postDraftService: PostDraftService,
    @Autowired private val adminPostService: AdminPostService,
    @Autowired private val fakeLlmGateway: FakeLlmGateway,
    @Autowired private val jdbc: JdbcClient,
) {
    // Truncate fires no row trigger, so it clears the append-only rows as well; the api itself never does.
    @BeforeEach
    @AfterEach
    fun clear() {
        jdbc.sql("truncate llm_call, ask_message, post_revision, post").update()
        fakeLlmGateway.reset()
        fakeLlmGateway.answers("## 세 번의 인사\n\nSYN, SYN-ACK, ACK 를 주고받습니다.")
    }

    private fun request(title: String = "객체, 설계") = PostCreateRequest(title = title, topicSlug = "spring")

    private fun stream(
        id: UUID,
        memo: String,
    ): ServerSentEvents {
        val recorder = ServerSentEvents.Recorder()
        postDraftService.draft(id, PostDraftRequest(memo = memo), recorder.stream)
        return recorder.events()
    }

    private fun draft(
        id: UUID,
        memo: String,
    ): PostDraftResponse = stream(id, memo).done(PostDraftResponse::class)

    private fun fails(
        error: BlogError,
        call: () -> Unit,
    ) {
        assertThatThrownBy(call).isInstanceOfSatisfying(BlogException::class.java) {
            assertThat(it.error).isEqualTo(error)
        }
    }

    private fun publish(post: AdminPostResponse) =
        adminPostService.publish(
            post.id,
            PostSaveRequest(
                version = post.version,
                title = post.title,
                slug = post.slug,
                topicSlug = post.topic.slug,
                position = post.position,
                summary = "요약",
                bodyMdx = "본문",
            ),
        )

    @Test
    fun `a memo becomes a body for the draft, and nothing is saved`() {
        val post = adminPostService.create(request())

        val draft = draft(post.id, "SYN 보내고 SYN-ACK 받고 ACK")

        val asked = fakeLlmGateway.asked.single()
        assertThat(asked.user).contains("<title>\n객체, 설계\n</title>", "<memo>\nSYN 보내고 SYN-ACK 받고 ACK\n</memo>")
        assertThat(asked.maxTokens).isEqualTo(8_192)
        assertThat(fakeLlmGateway.inTransaction).containsExactly(false)
        assertThat(draft.bodyMdx).isEqualTo("## 세 번의 인사\n\nSYN, SYN-ACK, ACK 를 주고받습니다.")
        assertThat(draft.model).isEqualTo("deepseek-flash")
        assertThat(draft.inputTokens).isEqualTo(1_000)
        assertThat(draft.outputTokens).isEqualTo(2_000)
        val kept = adminPostService.get(post.id)
        assertThat(kept.bodyMdx).isEmpty()
        assertThat(kept.version).isEqualTo(post.version)
        assertThat(jdbc.sql("select purpose from llm_call").query(String::class.java).single()).isEqualTo("MEMO")
    }

    @Test
    fun `a published post is not drafted, and the model is not asked`() {
        val post = publish(adminPostService.create(request()))

        fails(BlogError.POST_NOT_DRAFT) { draft(post.id, "메모") }
        assertThat(fakeLlmGateway.asked).isEmpty()
    }

    @Test
    fun `the body streams as the model writes it, then comes whole`() {
        val post = adminPostService.create(request())

        val events = stream(post.id, "메모")

        assertThat(events.names).containsExactly("text", "text", "text", "done")
        assertThat(events.text).isEqualTo(events.single("done").get("bodyMdx").asString())
    }

    @Test
    fun `an unknown post is not found`() {
        val unknown = UUID.fromString("019a3000-0000-7000-8000-00000000ffff")

        fails(BlogError.POST_NOT_FOUND) { draft(unknown, "메모") }
    }
}
