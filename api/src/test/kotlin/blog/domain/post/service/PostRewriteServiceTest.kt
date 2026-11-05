package blog.domain.post.service

import blog.ServerSentEvents
import blog.TestcontainersConfiguration
import blog.common.exception.BlogError
import blog.common.exception.BlogException
import blog.domain.llm.FakeLlmGateway
import blog.domain.post.dto.request.PostCreateRequest
import blog.domain.post.dto.request.PostRewriteRequest
import blog.domain.post.dto.request.PostSaveRequest
import blog.domain.post.dto.response.PostRewriteResponse
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
class PostRewriteServiceTest(
    @Autowired private val postRewriteService: PostRewriteService,
    @Autowired private val adminPostService: AdminPostService,
    @Autowired private val fakeLlmGateway: FakeLlmGateway,
    @Autowired private val jdbc: JdbcClient,
) {
    @BeforeEach
    @AfterEach
    fun clear() {
        jdbc.sql("truncate llm_call, ask_message, post_generation, post_revision, post").update()
        fakeLlmGateway.reset()
        fakeLlmGateway.answers("고친 문단입니다.\n둘째 줄입니다.")
    }

    private val request =
        PostRewriteRequest(before = "앞 문단", selected = "고칠 문단", after = "뒤 문단", instruction = "더 쉽게")

    private fun post() = adminPostService.create(PostCreateRequest(title = "객체, 설계", topicSlug = "spring"))

    private fun stream(id: UUID): ServerSentEvents {
        val recorder = ServerSentEvents.Recorder()
        postRewriteService.rewrite(id, request, recorder.stream)
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

    @Test
    fun `the replacement streams and comes whole, and nothing is saved`() {
        val post = post()

        val events = stream(post.id)

        assertThat(events.names).containsExactly("text", "text", "done")
        val rewrite = events.done(PostRewriteResponse::class)
        assertThat(rewrite.replacement).isEqualTo("고친 문단입니다.\n둘째 줄입니다.").isEqualTo(events.text)
        assertThat(rewrite.model).isEqualTo("deepseek-flash")
        assertThat(adminPostService.get(post.id).bodyMdx).isEmpty()
        assertThat(jdbc.sql("select count(*) from post_generation").query(Int::class.java).single()).isZero()
    }

    @Test
    fun `the model gets the passage, the post around it and the instruction, outside a transaction`() {
        stream(post().id)

        val asked = fakeLlmGateway.asked.single()
        assertThat(asked.system).contains("You rewrite one selected passage")
        assertThat(asked.user).contains(
            "<title>\n객체, 설계\n</title>",
            "<before>\n앞 문단\n</before>",
            "<selection>\n고칠 문단\n</selection>",
            "<after>\n뒤 문단\n</after>",
            "<instruction>\n더 쉽게\n</instruction>",
        )
        assertThat(fakeLlmGateway.inTransaction).containsExactly(false)
        assertThat(jdbc.sql("select purpose from llm_call").query(String::class.java).single()).isEqualTo("MEMO")
    }

    @Test
    fun `a published post is not rewritten, and the model is not asked`() {
        val post = post()
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

        fails(BlogError.POST_NOT_DRAFT) { stream(post.id) }
        assertThat(fakeLlmGateway.asked).isEmpty()
    }

    @Test
    fun `an unknown post is not found`() {
        fails(BlogError.POST_NOT_FOUND) { stream(UUID.fromString("019a3000-0000-7000-8000-00000000ffff")) }
    }
}
