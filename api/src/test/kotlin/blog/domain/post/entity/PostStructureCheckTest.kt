package blog.domain.post.entity

import blog.domain.post.entity.PostDraftCheck.Finding
import blog.domain.post.entity.PostDraftCheck.Kind
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

class PostStructureCheckTest {
    private val prose = "가".repeat(400)

    private val shaped =
        "키 여섯 개를 여덟 칸에 넣으면 충돌은 얼마나 날까요?\n\n" +
            "## 적재율\n\n$prose\n\n<WidgetIdea note=\"칸이 차오르는 모습\" />\n\n" +
            "## 체이닝\n\n$prose\n\n<HandshakeWidget />\n\n1. 처음부터 재생해 봅시다.\n\n" +
            "## 마무리\n\n$prose"

    @Test
    fun `a post in the shape has no findings`() {
        assertThat(PostStructureCheck.of(shaped)).isEmpty()
    }

    @Test
    fun `a heading deeper than a section is named, but not one inside code`() {
        val body = shaped.replace("## 체이닝\n\n", "## 체이닝\n\n### 원인\n\n```md\n### 코드\n```\n\n")

        assertThat(PostStructureCheck.of(body)).containsExactly(Finding(Kind.HEADING_DEPTH, "### 원인"))
    }

    @Test
    fun `a post of any length, in as many sections as it needs, has no findings`() {
        val sections = (1..5).joinToString("") { "## 갈래 $it\n\n${"나".repeat(600)}\n\n<WidgetIdea note=\"갈래\" />\n\n" }
        val long = "키는 몇 칸에 들어갈까요?\n\n$sections## 마무리\n\n${"다".repeat(600)}"

        assertThat(PostStructureCheck.of(long)).isEmpty()
    }

    @Test
    fun `a single section is the closing, and needs no figure`() {
        val only = "키는 몇 칸에 들어갈까요?\n\n## 마무리\n\n칸은 여덟입니다."

        assertThat(PostStructureCheck.of(only)).isEmpty()
    }

    @Test
    fun `the last section is the closing`() {
        assertThat(PostStructureCheck.of(shaped.replace("## 마무리", "## 정리")))
            .containsExactly(Finding(Kind.NO_CLOSING, "정리"))
    }

    @Test
    fun `the opening asks the question the post answers`() {
        val body = shaped.replace("얼마나 날까요?", "많이 납니다.")

        assertThat(PostStructureCheck.of(body))
            .containsExactly(Finding(Kind.NO_OPENING_QUESTION, "키 여섯 개를 여덟 칸에 넣으면 충돌은 많이 납니다."))
    }

    @Test
    fun `a question may close with a period, as Korean questions often do`() {
        assertThat(PostStructureCheck.of(shaped.replace("얼마나 날까요?", "얼마나 날까요."))).isEmpty()
    }

    @Test
    fun `each section but the closing has a figure`() {
        val body = shaped.replace("<WidgetIdea note=\"칸이 차오르는 모습\" />", "")

        assertThat(PostStructureCheck.of(body)).containsExactly(Finding(Kind.NO_FIGURE, "적재율"))
    }

    @Test
    fun `the hash table figure is a widget, whatever part it opens on`() {
        val body = shaped.replace("<HandshakeWidget />", "<HashTableFigure part=\"probing\" />")

        assertThat(PostStructureCheck.of(body)).isEmpty()
        assertThat(PostDraftCheck.of("메모", body).map { it.kind }).doesNotContain(Kind.NOT_RENDERABLE)
    }

    @Test
    fun `a widget comes with one to three steps, and a figure the reader cannot see with none`() {
        val bare = shaped.replace("1. 처음부터 재생해 봅시다.\n\n", "")
        val many = shaped.replace("1. 처음부터 재생해 봅시다.", (1..4).joinToString("\n") { "$it. 눌러 봅시다." })
        val unseen = shaped.replace("모습\" />", "모습\" />\n\n1. 칸을 채워 봅시다.")

        assertThat(PostStructureCheck.of(bare)).containsExactly(Finding(Kind.TRY_STEPS, "체이닝: 0개"))
        assertThat(PostStructureCheck.of(many)).containsExactly(Finding(Kind.TRY_STEPS, "체이닝: 4개"))
        assertThat(PostStructureCheck.of(unseen)).containsExactly(Finding(Kind.STEPS_WITHOUT_WIDGET, "적재율: 1개"))
    }

    @Test
    fun `a sentence that only supposes is not a step`() {
        val body = shaped.replace("모습\" />", "모습\" />\n\n가령 키가 여섯 개라고 해 봅시다.")

        assertThat(PostStructureCheck.of(body)).isEmpty()
    }
}
