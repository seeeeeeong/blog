package blog.domain.post.service

import blog.common.exception.BlogError
import blog.common.exception.BlogException
import blog.common.web.EventStream
import blog.domain.llm.dto.request.LlmRequest
import blog.domain.llm.dto.response.LlmResponse
import blog.domain.llm.service.LlmService
import blog.domain.post.dto.request.PostDraftRequest
import blog.domain.post.dto.response.PostDraftResponse
import blog.domain.post.dto.response.PostDraftReviewResponse
import blog.domain.post.entity.Post
import blog.domain.post.entity.PostDraftCheck
import blog.domain.post.entity.PostDraftPrompt
import blog.domain.post.entity.PostDraftReviewPrompt
import blog.domain.post.entity.PostGeneration
import blog.domain.post.entity.PostStatus
import blog.domain.post.entity.PostStructureCheck
import blog.domain.post.repository.JdbcPostGenerations
import blog.domain.post.repository.PostRepository
import org.slf4j.LoggerFactory
import org.springframework.dao.DataAccessException
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Service
import tools.jackson.core.JacksonException
import tools.jackson.databind.json.JsonMapper
import java.time.Clock
import java.util.UUID

/**
 * A post from the admin's memo: written, checked for its shape, reviewed against the memo, and
 * rewritten at most once for what the review calls critical and what the checks will not let pass.
 * The post stays as it was and each generation is only kept beside it; no transaction is held while
 * the model writes. Only the writing can fail the draft; a review or a rewrite that fails leaves the
 * draft as it was, and says so.
 */
@Service
class PostDraftService(
    private val postRepository: PostRepository,
    private val llmService: LlmService,
    private val jsonMapper: JsonMapper,
    private val jdbcPostGenerations: JdbcPostGenerations,
    private val clock: Clock,
) {
    private val log = LoggerFactory.getLogger(javaClass)

    /** One draft's way through the model, and every token it took. */
    private inner class Run(
        val title: String,
        val memo: String,
        val published: Set<String>,
        val events: EventStream,
    ) {
        var inputTokens = 0
        var outputTokens = 0

        fun ask(
            request: LlmRequest,
            onText: (String) -> Unit = {},
        ): LlmResponse {
            val answer = llmService.stream(request, onText)
            inputTokens += answer.inputTokens
            outputTokens += answer.outputTokens
            return answer
        }
    }

    /** Streams the first writing to [events], says when each later step starts, and ends with the whole as `done`. */
    fun draft(
        id: UUID,
        request: PostDraftRequest,
        events: EventStream,
    ) {
        val post = postRepository.findByIdOrNull(id) ?: throw BlogException(BlogError.POST_NOT_FOUND)
        if (post.status != PostStatus.DRAFT) throw BlogException(BlogError.POST_NOT_DRAFT)
        val published = postRepository.findPublishedNewestFirst()
        val prompt =
            PostDraftPrompt.of(
                title = post.title,
                memo = request.memo,
                published = published.map(::listed),
                next = postRepository.findPublishedAfter(post.topicId, post.position)?.let(::listed),
            )
        llmService.check()
        val run =
            Run(
                title = post.title,
                memo = request.memo,
                published = published.map { it.slug }.toSet(),
                events = events,
            )
        events.stream {
            events.stage(WRITING)
            val written = run.ask(writing(prompt), events::text)
            val firstChecks = checks(run, written.text)
            val first = review(run, written.text)
            val problems = problemsOf(first, firstChecks)
            val revised = problems.takeIf { it.isNotEmpty() }?.let { revise(run, written.text, it) }
            val draft =
                PostDraftResponse(
                    bodyMdx = revised ?: written.text,
                    review = if (revised == null) first else review(run, revised),
                    revised = revised != null,
                    checks = if (revised == null) firstChecks else checks(run, revised),
                    model = written.model,
                    inputTokens = run.inputTokens,
                    outputTokens = run.outputTokens,
                )
            keep(id, request.memo, draft)
            events.done(draft)
        }
    }

    // The admin has waited for this draft and is about to read it; failing to keep a copy must not cost it.
    private fun keep(
        postId: UUID,
        memo: String,
        draft: PostDraftResponse,
    ) {
        val generation =
            PostGeneration(
                postId = postId,
                memo = memo,
                written =
                    PostGeneration.Written(
                        bodyMdx = draft.bodyMdx,
                        reviewJson = draft.review?.let(jsonMapper::writeValueAsString),
                        checksJson = jsonMapper.writeValueAsString(draft.checks),
                        revised = draft.revised,
                    ),
                usage =
                    PostGeneration.Usage(
                        model = draft.model,
                        inputTokens = draft.inputTokens,
                        outputTokens = draft.outputTokens,
                    ),
                now = clock.instant(),
            )
        try {
            jdbcPostGenerations.append(generation)
        } catch (exception: DataAccessException) {
            log.warn("A generation could not be kept: {}", exception.javaClass.simpleName)
        }
    }

    private fun listed(post: Post) =
        PostDraftPrompt.Listed(slug = post.slug, title = post.title, summary = post.summary)

    private fun checks(
        run: Run,
        body: String,
    ): List<PostDraftCheck.Finding> = PostDraftCheck.of(run.memo, body, run.published) + PostStructureCheck.of(body)

    /** What the one rewrite is told: the review's critical facts, then the worst of what the checks found. */
    private fun problemsOf(
        review: PostDraftReviewResponse?,
        checks: List<PostDraftCheck.Finding>,
    ): List<String> {
        val facts = review?.critical.orEmpty().map { "[사실] ${it.problem} (\"${it.quote}\"): ${it.fix}" }
        val shape =
            checks
                .filter { it.severity != PostDraftCheck.Severity.INFO }
                .sortedBy { it.severity }
                .take(MAX_SHAPE_PROBLEMS)
                .map { "[구조] ${PostDraftCheck.problemOf(it)}" }
        return facts + shape
    }

    private fun writing(prompt: PostDraftPrompt.Messages) =
        LlmRequest(
            purpose = LlmRequest.Purpose.MEMO,
            system = prompt.system,
            user = prompt.user,
            maxTokens = PostDraftPrompt.MAX_TOKENS,
        )

    private fun review(
        run: Run,
        body: String,
    ): PostDraftReviewResponse? {
        if (run.events.readerLeft) return null
        run.events.stage(REVIEWING)
        val prompt = PostDraftReviewPrompt.of(memo = run.memo, draft = body)
        val request =
            LlmRequest(
                purpose = LlmRequest.Purpose.REVIEW,
                system = prompt.system,
                user = prompt.user,
                maxTokens = PostDraftReviewPrompt.MAX_TOKENS,
            )
        return tolerating("review") { parsed(run.ask(request).text) }
    }

    private fun parsed(answer: String): PostDraftReviewResponse? =
        try {
            PostDraftReviewPrompt.jsonOf(answer)?.let { jsonMapper.readValue(it, PostDraftReviewResponse::class.java) }
        } catch (_: JacksonException) {
            log.warn("A draft's review was not the JSON asked for")
            null
        }

    private fun revise(
        run: Run,
        body: String,
        problems: List<String>,
    ): String? {
        if (run.events.readerLeft) return null
        run.events.stage(REVISING)
        val prompt = PostDraftPrompt.revision(title = run.title, memo = run.memo, draft = body, problems = problems)
        return tolerating("rewrite") { run.ask(writing(prompt)).text }
    }

    private fun <T : Any> tolerating(
        step: String,
        block: () -> T?,
    ): T? =
        try {
            block()
        } catch (exception: BlogException) {
            log.warn("A draft's {} failed: {}", step, exception.error.code)
            null
        } catch (exception: DataAccessException) {
            log.warn("A draft's {} failed: {}", step, exception.javaClass.simpleName)
            null
        }

    private companion object {
        // A rewrite told everything at once rewrites everything; the rest stay on the admin's list.
        const val MAX_SHAPE_PROBLEMS = 6
        const val WRITING = "writing"
        const val REVIEWING = "reviewing"
        const val REVISING = "revising"
    }
}
