package blog.post.service

import blog.common.exception.BlogError
import blog.common.exception.BlogException
import blog.post.dto.request.PostCreateRequest
import blog.post.dto.request.PostSaveRequest
import blog.post.dto.response.AdminPostResponse
import blog.post.dto.response.AdminPostSummaryResponse
import blog.post.entity.Post
import blog.post.entity.PostContent
import blog.post.entity.PostRevision
import blog.post.entity.PostStatus
import blog.post.entity.SlugPolicy
import blog.post.entity.Topic
import blog.post.repository.JdbcPostRevisions
import blog.post.repository.PostRepository
import blog.post.repository.TopicRepository
import org.springframework.data.repository.findByIdOrNull
import org.springframework.orm.ObjectOptimisticLockingFailureException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.util.UUID

/** Posts as the admin writes them: drafts too, and every publish kept as a revision. */
@Service
@Transactional
class AdminPostService(
    private val postRepository: PostRepository,
    private val topicRepository: TopicRepository,
    private val jdbcPostRevisions: JdbcPostRevisions,
    private val clock: Clock,
) {
    @Transactional(readOnly = true)
    fun list(): List<AdminPostSummaryResponse> {
        val posts = postRepository.findAllByOrderByUpdatedAtDesc()
        val topics = topicRepository.findAll().associateBy { it.id }
        return posts.map { AdminPostSummaryResponse.from(it, topics.getValue(it.topicId)) }
    }

    @Transactional(readOnly = true)
    fun get(id: UUID): AdminPostResponse {
        val post = find(id)
        val topic = checkNotNull(topicRepository.findByIdOrNull(post.topicId)) { "A post's topic is kept" }
        return AdminPostResponse.from(post, topic)
    }

    fun create(request: PostCreateRequest): AdminPostResponse {
        val topic = topic(request.topicSlug)
        val slug = request.slug ?: freeSlug(SlugPolicy.derive(request.title))
        if (postRepository.existsBySlug(slug)) throw BlogException(BlogError.POST_SLUG_TAKEN)
        val post =
            Post(
                slug = slug,
                title = request.title.trim(),
                topicId = topic.id,
                position = postRepository.nextPosition(topic.id),
                summary = "",
                bodyMdx = "",
                now = clock.instant(),
            )
        postRepository.save(post)
        return AdminPostResponse.from(post, topic)
    }

    fun save(
        id: UUID,
        request: PostSaveRequest,
    ): AdminPostResponse {
        val post = find(id)
        if (post.status != PostStatus.DRAFT) throw BlogException(BlogError.POST_PUBLISHED_LOCKED)
        val topic = topic(request.topicSlug)
        val content = contentOf(post, request, topic)
        post.saveDraft(content, clock.instant())
        flush(post)
        return AdminPostResponse.from(post, topic)
    }

    fun publish(
        id: UUID,
        request: PostSaveRequest,
    ): AdminPostResponse {
        val post = find(id)
        if (request.summary.isBlank()) throw BlogException(BlogError.POST_SUMMARY_REQUIRED)
        val topic = topic(request.topicSlug)
        val content = contentOf(post, request, topic)
        val now = clock.instant()
        post.publish(content, now)
        // The post's row lock comes first, so two publishes number their revisions one after the other.
        flush(post)
        val revision = PostRevision(post = post, number = jdbcPostRevisions.nextNumber(post.id), now = now)
        jdbcPostRevisions.append(revision)
        return AdminPostResponse.from(post, topic)
    }

    private fun contentOf(
        post: Post,
        request: PostSaveRequest,
        topic: Topic,
    ): PostContent {
        if (post.version != request.version) throw BlogException(BlogError.POST_EDIT_CONFLICT)
        checkFree(post, request, topic)
        return PostContent(
            slug = request.slug,
            title = request.title.trim(),
            topicId = topic.id,
            position = request.position,
            summary = request.summary.trim(),
            bodyMdx = request.bodyMdx,
        )
    }

    /** The schema's unique keys would answer a 500; this names which one. */
    private fun checkFree(
        post: Post,
        request: PostSaveRequest,
        topic: Topic,
    ) {
        if (postRepository.existsBySlugAndIdNot(request.slug, post.id)) {
            throw BlogException(BlogError.POST_SLUG_TAKEN)
        }
        if (postRepository.existsByTopicIdAndPositionAndIdNot(topic.id, request.position, post.id)) {
            throw BlogException(BlogError.POST_POSITION_TAKEN)
        }
    }

    // The version check in contentOf sees a save that committed before this one loaded; this sees one in between.
    private fun flush(post: Post) {
        try {
            postRepository.saveAndFlush(post)
        } catch (exception: ObjectOptimisticLockingFailureException) {
            throw BlogException(BlogError.POST_EDIT_CONFLICT, exception)
        }
    }

    private fun freeSlug(slug: String): String =
        generateSequence(1) { it + 1 }
            .map { if (it == 1) slug else SlugPolicy.numbered(slug, it) }
            .first { !postRepository.existsBySlug(it) }

    private fun find(id: UUID): Post =
        postRepository.findByIdOrNull(id) ?: throw BlogException(BlogError.POST_NOT_FOUND)

    private fun topic(slug: String): Topic =
        topicRepository.findBySlug(slug) ?: throw BlogException(BlogError.POST_TOPIC_NOT_FOUND)
}
