package blog.post.service

import blog.TestcontainersConfiguration
import blog.common.exception.BlogError
import blog.common.exception.BlogException
import blog.post.Posts
import blog.post.repository.PostRepository
import blog.post.repository.TopicRepository
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

@SpringBootTest
@Import(TestcontainersConfiguration::class)
@Transactional
class PostServiceTest(
    @Autowired private val postService: PostService,
    @Autowired postRepository: PostRepository,
    @Autowired topicRepository: TopicRepository,
) {
    private val posts = Posts(postRepository, topicRepository)

    private fun notFound(call: () -> Unit) {
        assertThatThrownBy(call)
            .isInstanceOfSatisfying(
                BlogException::class.java,
            ) { assertThat(it.error).isEqualTo(BlogError.POST_NOT_FOUND) }
    }

    @Test
    fun `the list holds published posts only, the newest first`() {
        posts.published(
            slug = "tcp-handshake",
            topic = "network",
            position = 1,
            at = Instant.parse("2026-10-01T00:00:00Z"),
        )
        posts.published(slug = "b-tree", topic = "database", position = 1, at = Instant.parse("2026-10-03T00:00:00Z"))
        posts.published(slug = "process", topic = "os", position = 1, at = Instant.parse("2026-10-02T00:00:00Z"))
        posts.draft("udp", topic = "network", position = 2)

        val list = postService.list()

        assertThat(list.map { it.slug }).containsExactly("b-tree", "process", "tcp-handshake")
        assertThat(list.first().publishedAt).isEqualTo(Instant.parse("2026-10-03T00:00:00Z"))
    }

    @Test
    fun `a post is numbered by its topic's place, then its own within the topic`() {
        posts.published(slug = "tcp-handshake", topic = "network", position = 1)
        posts.published(slug = "bean-lifecycle", topic = "spring", position = 3)

        val numbers = postService.list().associate { it.slug to it.number }

        assertThat(
            numbers,
        ).containsExactlyInAnyOrderEntriesOf(mapOf("tcp-handshake" to "2.1", "bean-lifecycle" to "5.3"))
    }

    @Test
    fun `a published post is read with its body and its topic`() {
        posts.published(slug = "tcp-handshake", topic = "network", position = 1)

        val post = postService.get("tcp-handshake")

        assertThat(post.bodyMdx).isEqualTo("# tcp-handshake\n\n본문이다.")
        assertThat(post.topic.slug).isEqualTo("network")
        assertThat(post.topic.title).isEqualTo("네트워크")
        assertThat(post.number).isEqualTo("2.1")
    }

    @Test
    fun `a post links the published posts beside it in its topic, skipping drafts`() {
        posts.published(slug = "osi", topic = "network", position = 1)
        posts.draft("udp", topic = "network", position = 2)
        posts.published(slug = "tcp-handshake", topic = "network", position = 3)
        posts.published(slug = "http", topic = "network", position = 4)
        posts.published(slug = "process", topic = "os", position = 2)

        val post = postService.get("tcp-handshake")

        assertThat(post.previous?.slug).isEqualTo("osi")
        assertThat(post.previous?.number).isEqualTo("2.1")
        assertThat(post.next?.slug).isEqualTo("http")
        assertThat(post.next?.title).isEqualTo("제목 http")
    }

    @Test
    fun `a post alone in its topic has no neighbours`() {
        posts.published(slug = "tcp-handshake", topic = "network", position = 1)
        posts.published(slug = "process", topic = "os", position = 2)

        val post = postService.get("tcp-handshake")

        assertThat(post.previous).isNull()
        assertThat(post.next).isNull()
    }

    @Test
    fun `a draft is not found, as an unknown slug is`() {
        posts.draft("udp")

        notFound { postService.get("udp") }
        notFound { postService.get("missing") }
    }

    @Test
    fun `a slug no post could have is not found`() {
        notFound { postService.get("Not A Slug") }
    }
}
