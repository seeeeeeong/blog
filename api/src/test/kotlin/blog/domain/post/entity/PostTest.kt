package blog.domain.post.entity

import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.Test
import java.time.Instant
import java.util.UUID

class PostTest {
    private val written = Instant.parse("2026-10-01T00:00:00Z")
    private val topicId = UUID.randomUUID()

    private fun draft() =
        Post(
            slug = "tcp-handshake",
            title = "TCP 3-way handshake",
            topicId = topicId,
            position = 1,
            summary = "",
            bodyMdx = "",
            sectionId = null,
            now = written,
        )

    private fun content(
        title: String = "TCP 3-way handshake",
        summary: String = "연결을 여는 세 번의 왕복",
    ) = PostContent(
        slug = "tcp-handshake",
        title = title,
        topicId = topicId,
        position = 2,
        summary = summary,
        bodyMdx = "# TCP",
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
    fun `saving a draft changes its content and stays a draft`() {
        val post = draft()
        val saved = written.plusSeconds(60)

        post.saveDraft(content(summary = ""), saved)

        assertThat(post.content).isEqualTo(content(summary = ""))
        assertThat(post.status).isEqualTo(PostStatus.DRAFT)
        assertThat(post.updatedAt).isEqualTo(saved)
        assertThat(post.createdAt).isEqualTo(written)
    }

    @Test
    fun `publishing a draft shows its content from that moment`() {
        val post = draft()
        val published = written.plusSeconds(3600)

        post.publish(content(), published)

        assertThat(post.status).isEqualTo(PostStatus.PUBLISHED)
        assertThat(post.content).isEqualTo(content())
        assertThat(post.publishedAt).isEqualTo(published)
        assertThat(post.updatedAt).isEqualTo(published)
    }

    @Test
    fun `publishing again changes what readers see and keeps the first publish time`() {
        val post = draft()
        post.publish(content(), written)

        post.publish(content(title = "TCP handshake"), written.plusSeconds(60))

        assertThat(post.title).isEqualTo("TCP handshake")
        assertThat(post.publishedAt).isEqualTo(written)
        assertThat(post.updatedAt).isEqualTo(written.plusSeconds(60))
    }

    @Test
    fun `a post without a summary is not published`() {
        val post = draft()

        assertThatThrownBy { post.publish(content(summary = " "), written) }
            .isInstanceOf(IllegalArgumentException::class.java)
        assertThat(post.status).isEqualTo(PostStatus.DRAFT)
    }

    @Test
    fun `a published post is not saved as a draft`() {
        val post = draft()
        post.publish(content(), written)

        assertThatThrownBy { post.saveDraft(content(title = "고친 제목"), written.plusSeconds(1)) }
            .isInstanceOf(IllegalStateException::class.java)
        assertThat(post.title).isEqualTo("TCP 3-way handshake")
    }
}
