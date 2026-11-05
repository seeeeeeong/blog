package blog.domain.post.service

import blog.common.exception.BlogError
import blog.common.exception.BlogException
import blog.common.web.EventStream
import blog.domain.llm.dto.request.LlmRequest
import blog.domain.llm.service.LlmService
import blog.domain.post.dto.request.PostRewriteRequest
import blog.domain.post.dto.response.PostRewriteResponse
import blog.domain.post.entity.PostRewritePrompt
import blog.domain.post.entity.PostStatus
import blog.domain.post.repository.PostRepository
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Service
import java.util.UUID

/**
 * One selected passage rewritten. Nothing is saved, and no transaction is held while the model
 * writes. It adds nothing unless asked, so it goes without the review a whole draft gets.
 */
@Service
class PostRewriteService(
    private val postRepository: PostRepository,
    private val llmService: LlmService,
) {
    /** Streams the replacement to [events] as the model writes it, and ends with the whole as `done`. */
    fun rewrite(
        id: UUID,
        request: PostRewriteRequest,
        events: EventStream,
    ) {
        val post = postRepository.findByIdOrNull(id) ?: throw BlogException(BlogError.POST_NOT_FOUND)
        if (post.status != PostStatus.DRAFT) throw BlogException(BlogError.POST_NOT_DRAFT)
        val passage =
            PostRewritePrompt.Passage(
                before = request.before,
                selected = request.selected,
                after = request.after,
                instruction = request.instruction,
            )
        val prompt = PostRewritePrompt.of(post.title, passage)
        val llmRequest =
            LlmRequest(
                purpose = LlmRequest.Purpose.MEMO,
                system = prompt.system,
                user = prompt.user,
                maxTokens = PostRewritePrompt.MAX_TOKENS,
            )
        llmService.check(llmRequest.purpose)
        events.stream {
            events.stage(WRITING)
            val written = llmService.stream(llmRequest, events::text)
            val rewrite =
                PostRewriteResponse(
                    replacement = written.text,
                    model = written.model,
                    inputTokens = written.inputTokens,
                    outputTokens = written.outputTokens,
                )
            events.done(rewrite)
        }
    }

    private companion object {
        const val WRITING = "writing"
    }
}
