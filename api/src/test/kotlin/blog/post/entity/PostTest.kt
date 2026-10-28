package blog.post.entity

import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.Test
import java.time.Instant
import java.util.UUID

class PostTest {
    private val written = Instant.parse("2026-10-01T00:00:00Z")

    private fun draft() =
        Post(
            slug = "tcp-handshake",
            title = "TCP 3-way handshake",
            topicId = UUID.randomUUID(),
            position = 1,
            summary = "연결을 여는 세 번의 왕복",
            bodyMdx = "# TCP",
            now = written,
        )

    @Test
    fun `a new post is a draft with no publish time`() {
        val post = draft()

        assertThat(post.status).isEqualTo(PostStatus.DRAFT)
        assertThat(post.publishedAt).isNull()
        assertThat(post.createdAt).isEqualTo(written)
        assertThat(post.updatedAt).isEqualTo(written)
    }

    @Test
    fun `publishing a draft shows it from that moment`() {
        val post = draft()
        val published = written.plusSeconds(3600)

        post.publish(published)

        assertThat(post.status).isEqualTo(PostStatus.PUBLISHED)
        assertThat(post.publishedAt).isEqualTo(published)
        assertThat(post.updatedAt).isEqualTo(published)
    }

    @Test
    fun `a published post is not published again`() {
        val post = draft()
        post.publish(written)

        assertThatThrownBy { post.publish(written.plusSeconds(1)) }.isInstanceOf(IllegalStateException::class.java)
        assertThat(post.publishedAt).isEqualTo(written)
    }
}
