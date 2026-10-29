package blog.post.service

import blog.MutableClock
import blog.TestcontainersConfiguration
import blog.common.exception.BlogError
import blog.common.exception.BlogException
import blog.post.Posts
import blog.post.dto.request.PostCreateRequest
import blog.post.dto.request.PostSaveRequest
import blog.post.dto.response.AdminPostResponse
import blog.post.entity.PostStatus
import blog.post.repository.PostRepository
import blog.post.repository.TopicRepository
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.jdbc.core.simple.JdbcClient
import org.springframework.transaction.annotation.Transactional
import java.time.Duration
import java.time.Instant
import java.util.UUID

@SpringBootTest
@Import(TestcontainersConfiguration::class, MutableClock.Config::class)
@Transactional
class AdminPostServiceTest(
    @Autowired private val adminPostService: AdminPostService,
    @Autowired private val clock: MutableClock,
    @Autowired private val jdbc: JdbcClient,
    @Autowired postRepository: PostRepository,
    @Autowired topicRepository: TopicRepository,
) {
    private val posts = Posts(postRepository, topicRepository)

    @AfterEach
    fun resetClock() {
        clock.reset()
    }

    private fun fails(
        error: BlogError,
        call: () -> Unit,
    ) {
        assertThatThrownBy(call).isInstanceOfSatisfying(BlogException::class.java) {
            assertThat(it.error).isEqualTo(error)
        }
    }

    private fun create(
        title: String = "TCP 3-way handshake",
        topicSlug: String = "network",
        slug: String? = null,
    ) = adminPostService.create(PostCreateRequest(title = title, topicSlug = topicSlug, slug = slug))

    private fun AdminPostResponse.edited(
        title: String = this.title,
        slug: String = this.slug,
        topicSlug: String = topic.slug,
        position: Int = this.position,
        summary: String = "연결을 여는 세 번의 왕복",
        bodyMdx: String = "# TCP\n\n본문",
        version: Long = this.version,
    ) = PostSaveRequest(
        version = version,
        title = title,
        slug = slug,
        topicSlug = topicSlug,
        position = position,
        summary = summary,
        bodyMdx = bodyMdx,
    )

    private data class Revision(
        val number: Int,
        val title: String,
        val summary: String,
        val createdAt: Instant,
    )

    private fun revisionsOf(postId: UUID) =
        jdbc
            .sql("select number, title, summary, created_at from post_revision where post_id = :id order by number")
            .param("id", postId)
            .query { rs, _ ->
                Revision(
                    number = rs.getInt("number"),
                    title = rs.getString("title"),
                    summary = rs.getString("summary"),
                    createdAt = rs.getTimestamp("created_at").toInstant(),
                )
            }.list()

    @Test
    fun `a new post is an empty draft, last in its topic`() {
        posts.published(slug = "osi", topic = "network", position = 1)
        posts.draft("udp", topic = "network", position = 3)
        posts.published(slug = "process", topic = "os", position = 7)

        val post = create(title = "TCP 3-way handshake", topicSlug = "network")

        assertThat(post.status).isEqualTo(PostStatus.DRAFT)
        assertThat(post.position).isEqualTo(4)
        assertThat(post.number).isEqualTo("2.4")
        assertThat(post.summary).isEmpty()
        assertThat(post.bodyMdx).isEmpty()
        assertThat(post.publishedAt).isNull()
        assertThat(post.createdAt).isEqualTo(clock.instant())
    }

    @Test
    fun `the first post of a topic is its first`() {
        assertThat(create(topicSlug = "spring").position).isEqualTo(1)
    }

    @Test
    fun `a slug comes from the title, numbered when taken`() {
        val first = create(title = "TCP 3-way handshake")
        val second = create(title = "TCP 3-way Handshake!")
        val korean = create(title = "트랜잭션 격리 수준")

        assertThat(first.slug).isEqualTo("tcp-3-way-handshake")
        assertThat(second.slug).isEqualTo("tcp-3-way-handshake-2")
        assertThat(korean.slug).isEqualTo("post")
    }

    @Test
    fun `a slug given is kept, and refused when taken`() {
        posts.draft("tcp")

        assertThat(create(slug = "tcp-handshake").slug).isEqualTo("tcp-handshake")
        fails(BlogError.POST_SLUG_TAKEN) { create(slug = "tcp") }
    }

    @Test
    fun `an unknown topic is refused`() {
        fails(BlogError.POST_TOPIC_NOT_FOUND) { create(topicSlug = "cooking") }
    }

    @Test
    fun `saving a draft changes every field and the version`() {
        val draft = create()
        clock.advance(Duration.ofMinutes(5))

        val saved =
            adminPostService.save(
                draft.id,
                draft.edited(title = "TCP handshake", slug = "tcp", topicSlug = "os", position = 9, summary = ""),
            )

        assertThat(saved.title).isEqualTo("TCP handshake")
        assertThat(saved.slug).isEqualTo("tcp")
        assertThat(saved.topic.slug).isEqualTo("os")
        assertThat(saved.number).isEqualTo("1.9")
        assertThat(saved.summary).isEmpty()
        assertThat(saved.bodyMdx).isEqualTo("# TCP\n\n본문")
        assertThat(saved.status).isEqualTo(PostStatus.DRAFT)
        assertThat(saved.version).isGreaterThan(draft.version)
        assertThat(saved.updatedAt).isEqualTo(draft.createdAt.plus(Duration.ofMinutes(5)))
        assertThat(adminPostService.get(draft.id).title).isEqualTo("TCP handshake")
    }

    @Test
    fun `a save from a stale version is a conflict, not an overwrite`() {
        val draft = create()
        adminPostService.save(draft.id, draft.edited(title = "먼저 고친 제목"))

        fails(BlogError.POST_EDIT_CONFLICT) { adminPostService.save(draft.id, draft.edited(title = "나중 제목")) }
        assertThat(adminPostService.get(draft.id).title).isEqualTo("먼저 고친 제목")
    }

    @Test
    fun `a slug or a position another post holds is refused`() {
        posts.draft("udp", topic = "network", position = 1)
        val draft = create(topicSlug = "network")

        fails(BlogError.POST_SLUG_TAKEN) { adminPostService.save(draft.id, draft.edited(slug = "udp")) }
        fails(BlogError.POST_POSITION_TAKEN) { adminPostService.save(draft.id, draft.edited(position = 1)) }
    }

    @Test
    fun `a post keeps its own slug and position when saved again`() {
        val draft = create()

        val saved = adminPostService.save(draft.id, draft.edited())

        assertThat(saved.slug).isEqualTo(draft.slug)
        assertThat(saved.position).isEqualTo(draft.position)
    }

    @Test
    fun `an unknown post is not found`() {
        val missing = UUID.randomUUID()

        fails(BlogError.POST_NOT_FOUND) { adminPostService.get(missing) }
        fails(BlogError.POST_NOT_FOUND) { adminPostService.publish(missing, create().edited()) }
    }

    @Test
    fun `publishing a draft shows it to readers, dated now, as revision one`() {
        val draft = create()
        clock.advance(Duration.ofHours(1))

        val published = adminPostService.publish(draft.id, draft.edited(summary = "  세 번의 왕복  "))

        assertThat(published.status).isEqualTo(PostStatus.PUBLISHED)
        assertThat(published.publishedAt).isEqualTo(clock.instant())
        assertThat(published.summary).isEqualTo("세 번의 왕복")
        assertThat(revisionsOf(draft.id))
            .containsExactly(
                Revision(number = 1, title = "TCP 3-way handshake", summary = "세 번의 왕복", createdAt = clock.instant()),
            )
    }

    @Test
    fun `publishing again changes the post, keeps its date and appends a revision`() {
        val draft = create()
        val first = adminPostService.publish(draft.id, draft.edited())
        val firstAt = clock.instant()
        clock.advance(Duration.ofDays(2))

        val second = adminPostService.publish(draft.id, first.edited(title = "TCP handshake, again"))

        assertThat(second.title).isEqualTo("TCP handshake, again")
        assertThat(second.publishedAt).isEqualTo(firstAt)
        assertThat(second.updatedAt).isEqualTo(clock.instant())
        assertThat(revisionsOf(draft.id).map { it.number to it.title })
            .containsExactly(1 to "TCP 3-way handshake", 2 to "TCP handshake, again")
    }

    @Test
    fun `a post is not published without a summary, and no revision is kept`() {
        val draft = create()

        fails(BlogError.POST_SUMMARY_REQUIRED) { adminPostService.publish(draft.id, draft.edited(summary = " ")) }
        assertThat(adminPostService.get(draft.id).status).isEqualTo(PostStatus.DRAFT)
        assertThat(revisionsOf(draft.id)).isEmpty()
    }

    @Test
    fun `a published post is not saved as a draft, only published again`() {
        val draft = create()
        val published = adminPostService.publish(draft.id, draft.edited())

        fails(BlogError.POST_PUBLISHED_LOCKED) {
            adminPostService.save(draft.id, published.edited(title = "몰래 고친 제목"))
        }
    }

    @Test
    fun `a publish from a stale version is a conflict`() {
        val draft = create()
        adminPostService.save(draft.id, draft.edited())

        fails(BlogError.POST_EDIT_CONFLICT) { adminPostService.publish(draft.id, draft.edited()) }
        assertThat(revisionsOf(draft.id)).isEmpty()
    }

    @Test
    fun `the admin lists every post, drafts included, the latest change first`() {
        val older = create(title = "older")
        clock.advance(Duration.ofMinutes(1))
        val newer = create(title = "newer", topicSlug = "os")
        clock.advance(Duration.ofMinutes(1))
        adminPostService.publish(older.id, older.edited())

        val list = adminPostService.list()

        assertThat(list.map { it.slug }).containsExactly("older", "newer")
        assertThat(list.map { it.status }).containsExactly(PostStatus.PUBLISHED, PostStatus.DRAFT)
        assertThat(list.last().number).isEqualTo(newer.number)
        assertThat(list.last().publishedAt).isNull()
    }
}
