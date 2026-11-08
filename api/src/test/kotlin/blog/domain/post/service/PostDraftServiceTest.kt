package blog.domain.post.service

import blog.ServerSentEvents
import blog.TestcontainersConfiguration
import blog.common.exception.BlogError
import blog.common.exception.BlogException
import blog.common.web.EventStream
import blog.domain.llm.FakeLlmGateway
import blog.domain.post.dto.request.PostCreateRequest
import blog.domain.post.dto.request.PostDraftRequest
import blog.domain.post.dto.request.PostSaveRequest
import blog.domain.post.dto.response.AdminPostResponse
import blog.domain.post.dto.response.PostDraftResponse
import blog.domain.post.dto.response.PostDraftReviewResponse
import blog.domain.post.entity.PostDraftCheck
import jakarta.servlet.ServletOutputStream
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.dao.DataAccessResourceFailureException
import org.springframework.jdbc.core.simple.JdbcClient
import org.springframework.mock.web.MockHttpServletResponse
import tools.jackson.databind.json.JsonMapper
import java.io.IOException
import java.time.Duration
import java.util.UUID

// Not @Transactional: the model must be asked outside any transaction.
@SpringBootTest
@Import(TestcontainersConfiguration::class, FakeLlmGateway.Config::class)
class PostDraftServiceTest(
    @Autowired private val postDraftService: PostDraftService,
    @Autowired private val adminPostService: AdminPostService,
    @Autowired private val fakeLlmGateway: FakeLlmGateway,
    @Autowired private val jdbc: JdbcClient,
    @Autowired private val jsonMapper: JsonMapper,
) {
    private companion object {
        const val WRITTEN =
            "가령 연결을 처음 열 때 무슨 일이 생길까요?\n\n" +
                "## 세 번의 인사\n\nSYN, SYN-ACK, ACK 를 주고받습니다.\n\n<WidgetIdea note=\"주고받는 순서\" />\n\n" +
                "## 왜 세 번인가\n\n양쪽이 서로의 번호를 확인합니다.\n\n<WidgetIdea note=\"번호 확인\" />\n\n" +
                "## 마무리\n\n세 번이면 충분합니다.\n\n" +
                "<Quiz answers=\"3\">\n몇 번 주고받을까요? 숫자로 답하세요.\n\n<Explanation>\n세 번입니다.\n</Explanation>\n</Quiz>"
        val REWRITTEN = WRITTEN.replace("세 번의 인사", "고친 인사")
        const val MISSHAPEN = "## 초안\n\n본문입니다."
        const val CLEAN =
            """{"addedFacts": [{"claim": "주장", "quote": "인용", "confidence": "LOW"}], "corrections": [],
            "invented": [], "dropped": [], "critical": []}"""
        const val CRITICAL = """{"critical": [{"problem": "틀렸다", "quote": "인용", "fix": "고친다"}]}"""
    }

    /** A connection the reader has closed: every write fails. */
    private class LeftResponse : MockHttpServletResponse() {
        override fun getOutputStream(): ServletOutputStream = throw IOException("gone")
    }

    // Truncate fires no row trigger, so it clears the append-only rows as well; the api itself never does.
    @BeforeEach
    @AfterEach
    fun clear() {
        jdbc.sql("truncate llm_call, post_generation, post_revision, post").update()
        fakeLlmGateway.reset()
        fakeLlmGateway.answers(WRITTEN)
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

        val asked = fakeLlmGateway.asked.first()
        assertThat(asked.user).contains("<title>\n객체, 설계\n</title>", "<memo>\nSYN 보내고 SYN-ACK 받고 ACK\n</memo>")
        assertThat(asked.maxTokens).isEqualTo(64_000)
        assertThat(fakeLlmGateway.inTransaction).containsOnly(false)
        assertThat(draft.bodyMdx).isEqualTo(WRITTEN)
        assertThat(draft.model).isEqualTo("deepseek-flash")
        assertThat(draft.inputTokens).isEqualTo(2_000)
        assertThat(draft.outputTokens).isEqualTo(4_000)
        val kept = adminPostService.get(post.id)
        assertThat(kept.bodyMdx).isEmpty()
        assertThat(kept.version).isEqualTo(post.version)
        assertThat(jdbc.sql("select purpose from llm_call").query(String::class.java).list())
            .containsExactlyInAnyOrder("MEMO", "REVIEW")
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

        assertThat(events.names.first()).isEqualTo("stage")
        assertThat(events.names.drop(1).dropLast(2)).hasSizeGreaterThan(1).containsOnly("text")
        assertThat(events.names.takeLast(2)).containsExactly("stage", "done")
        assertThat(events.text).isEqualTo(events.single("done").get("bodyMdx").asString())
    }

    @Test
    fun `the writing and the review each ask their own model with their own rules`() {
        val post = adminPostService.create(request())

        draft(post.id, "메모")

        val (writing, review) = fakeLlmGateway.asked
        assertThat(writing.model).isEqualTo("deepseek-flash")
        assertThat(writing.system).contains("You may add technical knowledge")
        assertThat(writing.thinking).isTrue()
        assertThat(review.model).isEqualTo("deepseek-flash")
        assertThat(review.thinking).isTrue()
        assertThat(review.maxTokens).isEqualTo(64_000)
        assertThat(review.system).contains("You check a draft")
        assertThat(review.user).contains("<memo>\n메모\n</memo>", "<draft>\n가령 연결을")
    }

    @Test
    fun `a clean review comes with the draft, which is not rewritten`() {
        val post = adminPostService.create(request())
        fakeLlmGateway.answersInTurn(WRITTEN, CLEAN)

        val draft = draft(post.id, "메모")

        assertThat(fakeLlmGateway.asked).hasSize(2)
        assertThat(draft.bodyMdx).isEqualTo(WRITTEN)
        assertThat(draft.revised).isFalse()
        val added = draft.review?.addedFacts?.single()
        assertThat(added?.claim).isEqualTo("주장")
        assertThat(added?.confidence).isEqualTo(PostDraftReviewResponse.Confidence.LOW)
    }

    @Test
    fun `what the review calls critical is rewritten once, and the rewrite is reviewed`() {
        val post = adminPostService.create(request())
        fakeLlmGateway.answersInTurn(WRITTEN, CRITICAL, REWRITTEN, CLEAN)

        val events = stream(post.id, "메모")
        val draft = events.done(PostDraftResponse::class)

        assertThat(fakeLlmGateway.asked).hasSize(4)
        assertThat(fakeLlmGateway.asked[2].user).contains("<problems>\n- [사실] 틀렸다 (\"인용\"): 고친다\n</problems>")
        assertThat(draft.bodyMdx).isEqualTo(REWRITTEN)
        assertThat(draft.revised).isTrue()
        assertThat(draft.review?.critical).isEmpty()
        assertThat(events.events.filter { it.name == "stage" }.map { it.data.get("stage").asString() })
            .containsExactly("writing", "reviewing", "revising", "reviewing")
    }

    @Test
    fun `a critical problem left after the rewrite is shown, and there is no second rewrite`() {
        val post = adminPostService.create(request())
        fakeLlmGateway.answersInTurn(WRITTEN, CRITICAL, REWRITTEN, CRITICAL)

        val draft = draft(post.id, "메모")

        assertThat(fakeLlmGateway.asked).hasSize(4)
        assertThat(draft.bodyMdx).isEqualTo(REWRITTEN)
        assertThat(
            draft.review
                ?.critical
                ?.single()
                ?.problem,
        ).isEqualTo("틀렸다")
    }

    @Test
    fun `an answer that is not the JSON asked for leaves no review, never an empty one`() {
        val post = adminPostService.create(request())
        fakeLlmGateway.answersInTurn(WRITTEN, "문제 없습니다")

        val draft = draft(post.id, "메모")

        assertThat(draft.bodyMdx).isEqualTo(WRITTEN)
        assertThat(draft.review).isNull()
        assertThat(draft.revised).isFalse()
    }

    @Test
    fun `each generation is kept beside the post, with its memo and review`() {
        val post = adminPostService.create(request())
        fakeLlmGateway.answersInTurn(WRITTEN, CLEAN)

        draft(post.id, "메모")

        val kept =
            jdbc
                .sql("select memo, body_mdx, review->'addedFacts'->0->>'claim' as claim, revised from post_generation")
                .query { row, _ ->
                    listOf(
                        row.getString("memo"),
                        row.getString("body_mdx"),
                        row.getString("claim"),
                        row.getBoolean("revised"),
                    )
                }.single()
        assertThat(kept).containsExactly("메모", WRITTEN, "주장", false)
        assertThat(adminPostService.get(post.id).bodyMdx).isEmpty()
    }

    @Test
    fun `a generation without a review is kept as one`() {
        val post = adminPostService.create(request())
        fakeLlmGateway.answersInTurn(WRITTEN, "문제 없습니다")

        draft(post.id, "메모")

        val reviewed =
            jdbc.sql("select review is not null from post_generation").query(Boolean::class.java).single()
        assertThat(reviewed).isFalse()
    }

    @Test
    fun `a database that fails during the review leaves the draft, without a review`() {
        val post = adminPostService.create(request())
        fakeLlmGateway.answersInTurn(WRITTEN)
        fakeLlmGateway.throwingOnCall = 2 to DataAccessResourceFailureException("down")

        val draft = draft(post.id, "메모")

        assertThat(draft.bodyMdx).isEqualTo(WRITTEN)
        assertThat(draft.review).isNull()
    }

    @Test
    fun `a database that fails during the rewrite leaves the draft and the review that asked for it`() {
        val post = adminPostService.create(request())
        fakeLlmGateway.answersInTurn(WRITTEN, CRITICAL)
        fakeLlmGateway.throwingOnCall = 3 to DataAccessResourceFailureException("down")

        val draft = draft(post.id, "메모")

        assertThat(draft.bodyMdx).isEqualTo(WRITTEN)
        assertThat(draft.revised).isFalse()
        assertThat(
            draft.review
                ?.critical
                ?.single()
                ?.problem,
        ).isEqualTo("틀렸다")
    }

    @Test
    fun `a machine check runs on the body that comes back`() {
        val post = adminPostService.create(request())
        fakeLlmGateway.answersInTurn(WRITTEN, CLEAN)

        val draft = draft(post.id, "풀 10개")

        assertThat(draft.checks).contains(PostDraftCheck.Finding(PostDraftCheck.Kind.MEMO_NUMBER_MISSING, "10"))
        assertThat(draft.checks.map { it.severity }).containsOnly(PostDraftCheck.Severity.INFO)
        assertThat(fakeLlmGateway.asked).hasSize(2)
    }

    @Test
    fun `a reader who left before the review costs no more calls`() {
        val post = adminPostService.create(request())
        val leaving = EventStream(LeftResponse(), jsonMapper, Duration.ofMinutes(1))

        postDraftService.draft(post.id, PostDraftRequest(memo = "메모"), leaving)

        assertThat(fakeLlmGateway.asked).hasSize(1)
    }

    @Test
    fun `an unknown post is not found`() {
        val unknown = UUID.fromString("019a3000-0000-7000-8000-00000000ffff")

        fails(BlogError.POST_NOT_FOUND) { draft(unknown, "메모") }
    }

    @Test
    fun `a draft out of shape is rewritten once with what the checks found`() {
        val post = adminPostService.create(request())
        fakeLlmGateway.answersInTurn(MISSHAPEN, CLEAN, REWRITTEN, CLEAN)

        val draft = draft(post.id, "메모")

        assertThat(fakeLlmGateway.asked).hasSize(4)
        assertThat(fakeLlmGateway.asked[2].user)
            .contains("- [구조] `##` 섹션이", "- [구조] 마지막 섹션이 `## 마무리`가 아닙니다 (\"초안\")")
        assertThat(draft.bodyMdx).isEqualTo(REWRITTEN)
        assertThat(draft.revised).isTrue()
        assertThat(draft.checks.map { it.severity }).doesNotContain(PostDraftCheck.Severity.WARNING)
    }

    @Test
    fun `facts and shape go into the one rewrite together, the facts first`() {
        val post = adminPostService.create(request())
        fakeLlmGateway.answersInTurn(MISSHAPEN, CRITICAL, REWRITTEN, CLEAN)

        draft(post.id, "메모")

        val problems =
            fakeLlmGateway.asked[2]
                .user
                .substringAfter("<problems>\n")
                .lines()
        assertThat(problems.first()).isEqualTo("- [사실] 틀렸다 (\"인용\"): 고친다")
        assertThat(problems[1]).startsWith("- [구조] ")
    }

    @Test
    fun `the checks send a draft back even when its review could not be had`() {
        val post = adminPostService.create(request())
        fakeLlmGateway.answersInTurn(MISSHAPEN, "문제 없습니다", REWRITTEN, CLEAN)

        val draft = draft(post.id, "메모")

        assertThat(draft.revised).isTrue()
        assertThat(draft.bodyMdx).isEqualTo(REWRITTEN)
    }

    @Test
    fun `the rewrite hears at most six of the checks' problems`() {
        val post = adminPostService.create(request())
        val headings = (1..4).joinToString("\n\n") { "### 원인 $it" }
        fakeLlmGateway.answersInTurn("$MISSHAPEN\n\n$headings", CLEAN, REWRITTEN, CLEAN)

        draft(post.id, "메모")

        assertThat(
            fakeLlmGateway.asked[2]
                .user
                .lines()
                .count { it.startsWith("- [구조] ") },
        ).isEqualTo(6)
    }

    @Test
    fun `a link to a post that is not published goes back to be removed`() {
        val post = adminPostService.create(request())
        val linked = WRITTEN.replace("양쪽이", "[없는 글](/posts/nope)처럼 양쪽이")
        fakeLlmGateway.answersInTurn(linked, CLEAN, REWRITTEN, CLEAN)

        draft(post.id, "메모")

        assertThat(fakeLlmGateway.asked[2].user)
            .contains("- [구조] 발행된 글 목록에 없는 글로 링크했습니다 (\"/posts/nope\"): 링크를 지우고 글자만 남기세요")
    }

    @Test
    fun `the writing is told the published posts and the one that comes next in the topic`() {
        val drafted = adminPostService.create(request("TCP"))
        val next = publish(adminPostService.create(request("HTTP")))

        draft(drafted.id, "메모")

        assertThat(fakeLlmGateway.asked.first().user).contains(
            "<posts>\n/posts/${next.slug} | HTTP | 요약\n</posts>",
            "<next>\n/posts/${next.slug} | HTTP | 요약\n</next>",
        )
    }
}
