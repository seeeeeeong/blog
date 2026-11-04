package blog.domain.post.service

import blog.common.exception.BlogError
import blog.common.exception.BlogException
import blog.common.web.EventStream
import blog.domain.llm.dto.request.LlmRequest
import blog.domain.llm.service.LlmService
import blog.domain.post.dto.request.PostDraftRequest
import blog.domain.post.dto.response.PostDraftResponse
import blog.domain.post.entity.PostDraftPrompt
import blog.domain.post.entity.PostStatus
import blog.domain.post.repository.PostRepository
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Service
import java.util.UUID

/** A draft's body from the admin's memo. Nothing is saved, and no transaction is held while the model writes. */
@Service
class PostDraftService(
    private val postRepository: PostRepository,
    private val llmService: LlmService,
) {
    /** Streams the body to [events] as the model writes it, and ends with the whole as `done`. */
    fun draft(
        id: UUID,
        request: PostDraftRequest,
        events: EventStream,
    ) {
        val post = postRepository.findByIdOrNull(id) ?: throw BlogException(BlogError.POST_NOT_FOUND)
        if (post.status != PostStatus.DRAFT) throw BlogException(BlogError.POST_NOT_DRAFT)
        val prompt = PostDraftPrompt.of(title = post.title, memo = request.memo)
        val llmRequest =
            LlmRequest(
                purpose = LlmRequest.Purpose.MEMO,
                system = prompt.system,
                user = prompt.user,
                maxTokens = PostDraftPrompt.MAX_TOKENS,
            )
        llmService.check(llmRequest.purpose)
        events.stream {
            val written = llmService.stream(llmRequest, events::text)
            val draft =
                PostDraftResponse(
                    bodyMdx = written.text,
                    model = written.model,
                    inputTokens = written.inputTokens,
                    outputTokens = written.outputTokens,
                )
            events.done(draft)
        }
    }
}
