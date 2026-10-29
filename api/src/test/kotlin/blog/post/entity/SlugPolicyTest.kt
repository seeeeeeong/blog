package blog.post.entity

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

class SlugPolicyTest {
    private val slug = Regex(SlugPolicy.PATTERN)

    @Test
    fun `a title's ASCII words become the slug`() {
        assertThat(SlugPolicy.derive("TCP 3-way Handshake")).isEqualTo("tcp-3-way-handshake")
        assertThat(SlugPolicy.derive("  HTTP/1.1에서 HTTP/3까지 ")).isEqualTo("http-1-1-http-3")
    }

    @Test
    fun `a title with no ASCII word falls back to post`() {
        assertThat(SlugPolicy.derive("트랜잭션 격리 수준")).isEqualTo("post")
        assertThat(SlugPolicy.derive("!!!")).isEqualTo("post")
    }

    @Test
    fun `a long title is cut to the limit without a trailing hyphen`() {
        val derived = SlugPolicy.derive("a".repeat(99) + " b")

        assertThat(derived).hasSizeLessThanOrEqualTo(SlugPolicy.MAX_LENGTH).matches(slug.toPattern())
    }

    @Test
    fun `a numbered slug stays a slug within the limit`() {
        assertThat(SlugPolicy.numbered("post", 2)).isEqualTo("post-2")

        val long = SlugPolicy.numbered("a".repeat(SlugPolicy.MAX_LENGTH), 12)

        assertThat(long).hasSize(SlugPolicy.MAX_LENGTH).endsWith("-12").matches(slug.toPattern())
    }
}
