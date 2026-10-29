package blog.post.service

import blog.book.service.StudyNoteService
import blog.common.exception.BlogError
import blog.common.exception.BlogException
import blog.llm.dto.request.LlmRequest
import blog.llm.service.LlmService
import blog.post.dto.request.PostDraftRequest
import blog.post.dto.response.PostDraftResponse
import blog.post.entity.PostDraftPrompt
import blog.post.entity.PostStatus
import blog.post.repository.PostRepository
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Service
import java.util.UUID

/**
 * A draft's body from the admin's memo, with its section's study note as reference when it has one.
 * Nothing is saved, and no transaction is held while the model writes.
 */
@Service
class PostDraftService(
    private val postRepository: PostRepository,
    private val studyNoteService: StudyNoteService,
    private val llmService: LlmService,
) {
    fun draft(
        id: UUID,
        request: PostDraftRequest,
    ): PostDraftResponse {
        val post = postRepository.findByIdOrNull(id) ?: throw BlogException(BlogError.POST_NOT_FOUND)
        if (post.status != PostStatus.DRAFT) throw BlogException(BlogError.POST_NOT_DRAFT)
        val note = post.sectionId?.let(studyNoteService::find)
        val prompt = PostDraftPrompt.of(title = post.title, memo = request.memo, note = note?.bodyMdx)
        val llmRequest =
            LlmRequest(
                purpose = LlmRequest.Purpose.MEMO,
                system = prompt.system,
                user = prompt.user,
                maxTokens = PostDraftPrompt.MAX_TOKENS,
            )
        val written = llmService.write(llmRequest)
        return PostDraftResponse(
            bodyMdx = written.text,
            usedNote = note != null,
            model = written.model,
            inputTokens = written.inputTokens,
            outputTokens = written.outputTokens,
        )
    }
}
