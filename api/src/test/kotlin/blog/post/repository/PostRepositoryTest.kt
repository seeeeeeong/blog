package blog.post.repository

import blog.TestcontainersConfiguration
import blog.post.Posts
import blog.post.entity.Post
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

@SpringBootTest
@Import(TestcontainersConfiguration::class)
@Transactional
class PostRepositoryTest(
    @Autowired private val postRepository: PostRepository,
    @Autowired private val topicRepository: TopicRepository,
) {
    private val posts = Posts(postRepository, topicRepository)

    private fun network() = topicRepository.findAll().first { it.slug == "network" }

    @Test
    fun `published posts come newest first, drafts left out`() {
        posts.published(slug = "old", position = 1, at = Instant.parse("2026-10-01T00:00:00Z"))
        posts.published(slug = "new", position = 2, at = Instant.parse("2026-10-03T00:00:00Z"))
        posts.published(slug = "middle", topic = "os", position = 1, at = Instant.parse("2026-10-02T00:00:00Z"))
        posts.draft("draft", position = 3, at = Instant.parse("2026-10-04T00:00:00Z"))

        val newest = postRepository.findPublishedNewestFirst()

        assertThat(newest.map { it.slug }).containsExactly("new", "middle", "old")
    }

    @Test
    fun `posts published at the same instant put the later written first`() {
        val publishedAt = Instant.parse("2026-10-05T00:00:00Z")
        val earlier = written("earlier", position = 1, at = Instant.parse("2026-10-01T00:00:00Z"))
        val later = written("later", position = 2, at = Instant.parse("2026-10-02T00:00:00Z"))
        earlier.publish(earlier.content, publishedAt)
        later.publish(later.content, publishedAt)
        postRepository.saveAll(listOf(earlier, later))

        val newest = postRepository.findPublishedNewestFirst()

        assertThat(newest.map { it.slug }).containsExactly("later", "earlier")
    }

    @Test
    fun `the neighbours are the nearest published posts by position in the same topic`() {
        posts.published(slug = "first", position = 1)
        posts.published(slug = "second", position = 2)
        posts.draft("third", position = 3)
        posts.published(slug = "fourth", position = 4)
        posts.published(slug = "fifth", position = 5)
        posts.published(slug = "elsewhere", topic = "os", position = 3)
        val topicId = network().id

        val before = postRepository.findPublishedBefore(topicId, 4)
        val after = postRepository.findPublishedAfter(topicId, 2)

        assertThat(before?.slug).isEqualTo("second")
        assertThat(after?.slug).isEqualTo("fourth")
    }

    @Test
    fun `the first and the last post of a topic have no neighbour on their open side`() {
        posts.published(slug = "first", position = 1)
        posts.published(slug = "last", position = 2)
        posts.draft("draft", position = 3)
        posts.published(slug = "elsewhere", topic = "os", position = 9)
        val topicId = network().id

        assertThat(postRepository.findPublishedBefore(topicId, 1)).isNull()
        assertThat(postRepository.findPublishedAfter(topicId, 2)).isNull()
    }

    private fun written(
        slug: String,
        position: Int,
        at: Instant,
    ) = Post(
        slug = slug,
        title = "제목 $slug",
        topicId = network().id,
        position = position,
        summary = "요약 $slug",
        bodyMdx = "본문이다.",
        now = at,
    )
}
