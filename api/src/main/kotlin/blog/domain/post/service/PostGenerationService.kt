package blog.domain.post.service

import blog.common.exception.BlogError
import blog.common.exception.BlogException
import blog.domain.post.dto.response.PostDraftResponse
import blog.domain.post.dto.response.PostDraftReviewResponse
import blog.domain.post.dto.response.PostGenerationResponse
import blog.domain.post.entity.PostDraftCheck
import blog.domain.post.repository.JdbcPostGenerations
import blog.domain.post.repository.PostRepository
import org.springframework.stereotype.Service
import tools.jackson.core.JacksonException
import tools.jackson.core.type.TypeReference
import tools.jackson.databind.json.JsonMapper
import java.util.UUID

/** The drafts kept beside a post, newest first, so one closed unread can be opened again. */
@Service
class PostGenerationService(
    private val postRepository: PostRepository,
    private val jdbcPostGenerations: JdbcPostGenerations,
    private val jsonMapper: JsonMapper,
) {
    fun list(postId: UUID): List<PostGenerationResponse> {
        if (!postRepository.existsById(postId)) throw BlogException(BlogError.POST_NOT_FOUND)
        return jdbcPostGenerations.newestFor(postId, LIMIT).map(::responseOf)
    }

    private fun responseOf(kept: JdbcPostGenerations.Kept) =
        PostGenerationResponse(
            id = kept.id,
            memo = kept.memo,
            createdAt = kept.createdAt,
            draft =
                PostDraftResponse(
                    bodyMdx = kept.written.bodyMdx,
                    review = kept.written.reviewJson?.let(::reviewOf),
                    revised = kept.written.revised,
                    checks = checksOf(kept.written.checksJson),
                    model = kept.usage.model,
                    inputTokens = kept.usage.inputTokens,
                    outputTokens = kept.usage.outputTokens,
                ),
        )

    private fun reviewOf(json: String): PostDraftReviewResponse? =
        try {
            jsonMapper.readValue(json, PostDraftReviewResponse::class.java)
        } catch (_: JacksonException) {
            null
        }

    // A check since dropped from the rules, such as the old quiz one, no longer applies to the draft.
    private fun checksOf(json: String): List<PostDraftCheck.Finding> {
        val kinds = PostDraftCheck.Kind.entries.associateBy { it.name }
        return jsonMapper.readValue(json, FINDINGS).mapNotNull { finding ->
            val kind = kinds[finding["kind"]] ?: return@mapNotNull null
            PostDraftCheck.Finding(kind, finding["detail"].orEmpty())
        }
    }

    private companion object {
        const val LIMIT = 20
        val FINDINGS = object : TypeReference<List<Map<String, String>>>() {}
    }
}
