package blog.post.service

import blog.common.exception.BlogError
import blog.common.exception.BlogException
import blog.post.dto.request.PostCreateRequest
import blog.post.dto.response.AdminPostResponse
import blog.post.dto.response.AdminPostSummaryResponse
import blog.post.repository.PostRepository
import blog.post.repository.TopicRepository
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

/** Posts by the book section each was written for, which holds one at most; the book feature asks here. */
@Service
@Transactional(readOnly = true)
class SectionPostService(
    private val postRepository: PostRepository,
    private val topicRepository: TopicRepository,
    private val adminPostService: AdminPostService,
) {
    fun find(sectionId: UUID): AdminPostResponse? {
        val post = postRepository.findBySectionId(sectionId) ?: return null
        val topic = checkNotNull(topicRepository.findByIdOrNull(post.topicId)) { "A post's topic is kept" }
        return AdminPostResponse.from(post, topic)
    }

    /** Drafts included, for the admin. */
    fun list(sectionIds: Collection<UUID>): Map<UUID, AdminPostSummaryResponse> {
        if (sectionIds.isEmpty()) return emptyMap()
        val posts = postRepository.findAllBySectionIdIn(sectionIds)
        val topics = topicRepository.findAll().associateBy { it.id }
        return posts.associate {
            checkNotNull(it.sectionId) to AdminPostSummaryResponse.from(it, topics.getValue(it.topicId))
        }
    }

    @Transactional
    fun create(
        sectionId: UUID,
        request: PostCreateRequest,
    ): AdminPostResponse {
        if (postRepository.findBySectionId(sectionId) != null) throw BlogException(BlogError.POST_SECTION_TAKEN)
        return adminPostService.create(request, sectionId)
    }
}
