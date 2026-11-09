package blog.domain.post.service

import blog.common.exception.BlogError
import blog.common.exception.BlogException
import blog.common.web.EventStream
import blog.domain.llm.dto.request.LlmRequest
import blog.domain.llm.service.LlmService
import blog.domain.post.dto.request.PostDraftRequest
import blog.domain.post.dto.response.PostQuestionsResponse
import blog.domain.post.entity.PostDraftReviewPrompt
import blog.domain.post.entity.PostQuestionPrompt
import blog.domain.post.entity.PostStatus
import blog.domain.post.repository.PostRepository
import org.slf4j.LoggerFactory
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Service
import tools.jackson.core.JacksonException
import tools.jackson.databind.json.JsonMapper
import java.util.UUID

/**
 * Questions for the owner about a memo before it is written up. Nothing is saved, and no transaction
 * is held while the model thinks; the answers go back to the draft inside the memo.
 */
@Service
class PostQuestionService(
    private val postRepository: PostRepository,
    private val llmService: LlmService,
    private val jsonMapper: JsonMapper,
) {
    private val log = LoggerFactory.getLogger(javaClass)

    private data class Asked(
        val questions: List<String> = emptyList(),
    )

    /** Ends with the questions as `done`; the text in between is the model's JSON, not for showing. */
    fun ask(
        id: UUID,
        request: PostDraftRequest,
        events: EventStream,
    ) {
        val post = postRepository.findByIdOrNull(id) ?: throw BlogException(BlogError.POST_NOT_FOUND)
        if (post.status != PostStatus.DRAFT) throw BlogException(BlogError.POST_NOT_DRAFT)
        val prompt = PostQuestionPrompt.of(post.title, request.memo)
        val llmRequest =
            LlmRequest(
                purpose = LlmRequest.Purpose.MEMO,
                system = prompt.system,
                user = prompt.user,
                maxTokens = PostQuestionPrompt.MAX_TOKENS,
            )
        llmService.check()
        events.stream {
            val answer = llmService.stream(llmRequest, events::text)
            events.done(
                PostQuestionsResponse(
                    questions = questionsOf(answer.text),
                    model = answer.model,
                    inputTokens = answer.inputTokens,
                    outputTokens = answer.outputTokens,
                ),
            )
        }
    }

    // Questions that do not come back as asked leave the admin to write the draft without them.
    private fun questionsOf(answer: String): List<String> =
        try {
            val json = PostDraftReviewPrompt.jsonOf(answer) ?: return emptyList()
            PostQuestionPrompt.kept(jsonMapper.readValue(json, Asked::class.java).questions)
        } catch (_: JacksonException) {
            log.warn("A memo's questions were not the JSON asked for")
            emptyList()
        }
}
