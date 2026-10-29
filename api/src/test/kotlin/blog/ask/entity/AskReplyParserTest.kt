package blog.ask.entity

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

class AskReplyParserTest {
    private fun read(vararg pieces: String): Pair<AskReplyParser.Header?, String> {
        val parser = AskReplyParser()
        val shown = pieces.joinToString("") { parser.take(it) } + parser.finish()
        return parser.header to shown
    }

    @Test
    fun `the header is read off and the answer handed on`() {
        val (header, shown) = read("GROUNDED: yes\nSOURCES: tcp-handshake, b-tree\n\n세 번 인사합니다.")

        assertThat(header).isEqualTo(AskReplyParser.Header(grounded = true, slugs = listOf("tcp-handshake", "b-tree")))
        assertThat(shown).isEqualTo("세 번 인사합니다.")
    }

    @Test
    fun `a header split across pieces is read the same, and the answer flows once it is`() {
        val parser = AskReplyParser()

        val held = listOf("GROUN", "DED: no\nSOU", "RCES: -\n", "\n").map { parser.take(it) }
        val first = parser.take("일반적으로")
        val next = parser.take(" 그렇습니다.")

        assertThat(held).containsOnly("")
        assertThat(parser.header).isEqualTo(AskReplyParser.Header(grounded = false, slugs = emptyList()))
        assertThat(first).isEqualTo("일반적으로")
        assertThat(next).isEqualTo(" 그렇습니다.")
    }

    @Test
    fun `keys are read in any case and order, and slugs that are not slugs are dropped`() {
        val (header, shown) = read("sources: TCP, a-b, a-b, ../x, c, d, e\ngrounded:YES\n답")

        assertThat(header?.grounded).isTrue()
        assertThat(header?.slugs).containsExactly("a-b", "c", "d")
        assertThat(shown).isEqualTo("답")
    }

    @Test
    fun `a reply without the header is not grounded and is shown whole`() {
        val (header, shown) = read("TCP 는 ", "연결을 맺습니다.\n두 번째 줄")

        assertThat(header).isEqualTo(AskReplyParser.Header(grounded = false, slugs = emptyList()))
        assertThat(shown).isEqualTo("TCP 는 연결을 맺습니다.\n두 번째 줄")
    }

    @Test
    fun `a long first line with no break is not waited on for a header`() {
        val parser = AskReplyParser()

        val shown = parser.take("가".repeat(301))

        assertThat(shown).hasSize(301)
        assertThat(parser.header?.grounded).isFalse()
    }

    @Test
    fun `a header with no answer after it ends with nothing to show`() {
        val (header, shown) = read("GROUNDED: yes\nSOURCES: -\n")

        assertThat(header?.grounded).isTrue()
        assertThat(shown).isEmpty()
    }

    @Test
    fun `only the leading header is read, and a later line that looks like one is answer`() {
        val (_, shown) = read("GROUNDED: yes\nSOURCES: -\n\n답입니다.\nGROUNDED: no\n")

        assertThat(shown).isEqualTo("답입니다.\nGROUNDED: no\n")
    }
}
