package blog.domain.post.entity

import blog.domain.post.entity.PostDraftCheck.Finding
import blog.domain.post.entity.PostDraftCheck.Kind
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

class PostDraftCheckTest {
    @Test
    fun `a body that keeps the memo and what the blog renders has no findings`() {
        val memo = "풀 10개, 30초\n\n```java\nlock.lock();\n```\nhttps://openjdk.org/jeps/491"
        val body =
            "풀은 10개, 타임아웃은 30초입니다. [JEP](https://openjdk.org/jeps/491)\n\n" +
                "```java\nlock.lock();\n```\n\n<Callout label=\"핵심\">짧게</Callout>\n\n<Seek to={0.95}>끝</Seek>"

        assertThat(PostDraftCheck.of(memo, body)).isEmpty()
    }

    @Test
    fun `code from the memo must survive, apart from its spacing`() {
        val memo = "```java\nThread.sleep(100); // 묶임\nsave();\n```"

        assertThat(PostDraftCheck.of(memo, "```java\n  Thread.sleep(100); // 묶임\n  save();\n```")).isEmpty()
        assertThat(PostDraftCheck.of(memo, "```java\nThread.sleep(100);\n```"))
            .containsExactly(Finding(Kind.MEMO_CODE_CHANGED, "Thread.sleep(100); // 묶임"))
    }

    @Test
    fun `a number in the memo's prose must survive, and one only in its code need not`() {
        val memo = "JEP 491 이고 timeout 30\n\n```java\nsleep(100);\n```"
        val body = "JEP 491 입니다.\n\n```java\nsleep(100);\n```"

        assertThat(PostDraftCheck.of(memo, body)).containsExactly(Finding(Kind.MEMO_NUMBER_MISSING, "30"))
    }

    @Test
    fun `a number inside a longer one does not count as kept`() {
        assertThat(PostDraftCheck.of("30초", "30000ms 입니다")).containsExactly(Finding(Kind.MEMO_NUMBER_MISSING, "30"))
    }

    @Test
    fun `a link the memo does not give is named`() {
        assertThat(PostDraftCheck.of("메모", "[글](https://example.com/a) 참고"))
            .containsExactly(Finding(Kind.LINK_ADDED, "https://example.com/a"))
    }

    @Test
    fun `what the blog cannot render is named, but not inside code`() {
        val body = "# 제목\n\n| a | b |\n\nimport x\n\n{value}\n\n<div>글</div>\n\n<Mark>표시</Mark>"

        assertThat(PostDraftCheck.of("메모", body).map { it.detail })
            .containsExactly("# 제목", "표", "import 또는 export", "중괄호", "<div>", "</div>")
        assertThat(PostDraftCheck.of("메모", "`<div>` 와 `{x}`\n\n```html\n<div>{x}</div>\n```")).isEmpty()
    }

    @Test
    fun `a code block left open is named`() {
        assertThat(PostDraftCheck.of("메모", "```java\nsave();"))
            .containsExactly(Finding(Kind.NOT_RENDERABLE, "닫히지 않은 코드 블록"))
    }
}
