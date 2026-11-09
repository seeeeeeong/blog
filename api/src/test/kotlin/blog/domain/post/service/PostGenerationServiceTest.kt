package blog.domain.post.service

import blog.TestcontainersConfiguration
import blog.common.exception.BlogError
import blog.common.exception.BlogException
import blog.domain.llm.FakeLlmGateway
import blog.domain.post.dto.request.PostCreateRequest
import blog.domain.post.entity.PostDraftCheck
import blog.domain.post.entity.PostDraftCheck.Finding
import blog.domain.post.entity.PostDraftCheck.Kind
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.jdbc.core.simple.JdbcClient
import java.sql.Timestamp
import java.time.Instant
import java.util.UUID

@SpringBootTest
@Import(TestcontainersConfiguration::class, FakeLlmGateway.Config::class)
class PostGenerationServiceTest(
    @Autowired private val postGenerationService: PostGenerationService,
    @Autowired private val adminPostService: AdminPostService,
    @Autowired private val jdbc: JdbcClient,
) {
    // Truncate fires no row trigger, so it clears the append-only rows as well; the api itself never does.
    @BeforeEach
    @AfterEach
    fun clear() {
        jdbc.sql("truncate llm_call, post_generation, post_revision, post").update()
    }

    private fun post(): UUID = adminPostService.create(PostCreateRequest(title = "해시", topicSlug = "spring")).id

    private fun kept(
        postId: UUID,
        memo: String,
        at: Instant,
        review: String? = null,
        checks: String = "[]",
    ) {
        jdbc
            .sql(
                """
                insert into post_generation (id, post_id, memo, body_mdx, review, checks, revised, model,
                                             input_tokens, output_tokens, created_at)
                values (:id, :postId, :memo, :body, cast(:review as jsonb), cast(:checks as jsonb), true,
                        'deepseek-flash', 10, 20, :at)
                """.trimIndent(),
            ).param("id", UUID.randomUUID())
            .param("postId", postId)
            .param("memo", memo)
            .param("body", "$memo 본문")
            .param("review", review)
            .param("checks", checks)
            .param("at", Timestamp.from(at))
            .update()
    }

    @Test
    fun `the drafts kept for a post come back newest first, as they were written`() {
        val id = post()
        val other = post()
        kept(id, "처음", Instant.parse("2026-11-01T00:00:00Z"))
        kept(
            postId = id,
            memo = "나중",
            at = Instant.parse("2026-11-02T00:00:00Z"),
            review = """{"addedFacts": [], "corrections": [], "invented": [], "dropped": [], "critical": []}""",
            checks = """[{"kind": "LENGTH", "detail": "900자", "severity": "INFO"}]""",
        )
        kept(other, "다른 글", Instant.parse("2026-11-03T00:00:00Z"))

        val generations = postGenerationService.list(id)

        assertThat(generations.map { it.memo }).containsExactly("나중", "처음")
        val newest = generations.first()
        assertThat(newest.draft.bodyMdx).isEqualTo("나중 본문")
        assertThat(newest.draft.review).isNotNull
        assertThat(newest.draft.revised).isTrue
        assertThat(newest.draft.checks).containsExactly(Finding(Kind.LENGTH, "900자"))
        assertThat(newest.draft.inputTokens).isEqualTo(10)
        assertThat(generations.last().draft.review).isNull()
    }

    @Test
    fun `a check the rules have since dropped is left out`() {
        val id = post()
        kept(
            postId = id,
            memo = "메모",
            at = Instant.parse("2026-11-01T00:00:00Z"),
            checks =
                """[{"kind": "QUIZ", "detail": "없음", "severity": "WARNING"},""" +
                    """ {"kind": "NO_FIGURE", "detail": "체이닝", "severity": "WARNING"}]""",
        )

        val checks =
            postGenerationService
                .list(id)
                .single()
                .draft.checks

        assertThat(checks).containsExactly(Finding(Kind.NO_FIGURE, "체이닝"))
        assertThat(checks.single().severity).isEqualTo(PostDraftCheck.Severity.WARNING)
    }

    @Test
    fun `a post that does not exist is not found`() {
        assertThatThrownBy { postGenerationService.list(UUID.randomUUID()) }
            .isInstanceOfSatisfying(BlogException::class.java) {
                assertThat(it.error).isEqualTo(BlogError.POST_NOT_FOUND)
            }
    }
}
