package blog.book.entity

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

class TocParserTest {
    // "3 title" for a chapter, "  3.2 title" for a section.
    private fun outline(contents: String): List<String> =
        TocParser.parse(contents).flatMap { chapter ->
            listOf("${chapter.number} ${chapter.title}") + chapter.sections.map { "  ${it.number} ${it.title}" }
        }

    @Test
    fun `chapters and dotted sections, deeper items and parts left out`() {
        val contents =
            """
            1부 기초
            1장 객체, 설계
            1.1 티켓 판매 애플리케이션
            1.1.1 요구사항
            1.2 무엇이 문제인가
            제2장. 객체지향 프로그래밍
            2.1 영화 예매
            """.trimIndent()

        assertThat(outline(contents)).containsExactly(
            "1 객체, 설계",
            "  1.1 티켓 판매 애플리케이션",
            "  1.2 무엇이 문제인가",
            "2 객체지향 프로그래밍",
            "  2.1 영화 예매",
        )
    }

    @Test
    fun `under a labelled chapter a bare number is a section, numbered within the chapter`() {
        val contents = "01장: 객체, 설계\n01. 티켓 판매\n   예상을 빗나가는 코드\n02. 무엇이 문제인가\n02장: 객체지향\n01. 영화 예매"

        assertThat(outline(contents)).containsExactly(
            "1 객체, 설계",
            "  1.1 티켓 판매",
            "  1.2 무엇이 문제인가",
            "2 객체지향",
            "  2.1 영화 예매",
        )
    }

    @Test
    fun `without labels a bare number is a chapter, and English labels read too`() {
        assertThat(outline("1. 소개\n1.1 설치\n2 설정\n2.1 포트")).containsExactly(
            "1 소개",
            "  1.1 설치",
            "2 설정",
            "  2.1 포트",
        )
        assertThat(
            outline("Chapter 3 Getting Started\n3.1 Install"),
        ).containsExactly("3 Getting Started", "  3.1 Install")
    }

    @Test
    fun `before the first labelled chapter, a bare number belongs to the introduction`() {
        val contents = "들어가며: 프로그래밍 패러다임\n01 패러다임의 시대\n02 프로그래밍 패러다임\n1장: 객체, 설계\n01. 티켓 판매"

        assertThat(outline(contents)).containsExactly("1 객체, 설계", "  1.1 티켓 판매")
    }

    @Test
    fun `front matter is left out, back matter too, and an appendix is a chapter`() {
        val contents = "들어가며\n지은이의 말\n1장 대화\n부록 A. 계약에 의한 설계\nA.1 사전 조건\n찾아보기"

        assertThat(outline(contents)).containsExactly("1 대화", "  1.1 대화", "A 계약에 의한 설계", "  A.1 사전 조건")
    }

    @Test
    fun `an appendix that is only back matter is left out`() {
        val contents = "1장 대화\n1.1 질문\n부록D: 참고문헌\n___ 참고문헌"

        assertThat(outline(contents)).containsExactly("1 대화", "  1.1 질문")
    }

    @Test
    fun `contents that list chapters alone study each chapter whole`() {
        val contents = "옮긴이의 글\n\n1장 사용자 수에 따른 규모 확장성\n2장 개략적인 규모 추정\n\n맺음말\n찾아보기"

        assertThat(outline(contents)).containsExactly(
            "1 사용자 수에 따른 규모 확장성",
            "  1.1 사용자 수에 따른 규모 확장성",
            "2 개략적인 규모 추정",
            "  2.1 개략적인 규모 추정",
        )
    }

    @Test
    fun `unnumbered lines under a chapter are its sections, numbered in order, when none has a number`() {
        val contents =
            """
            제1부. AI 거인들의 전쟁
            제1장. 마침내 GPT-5 등장하다

            GPT-5 시대의 개막
                한 걸음 더
            인류의 마지막 시험
            제2장. 빅3+1
            클로드, 코딩과 글쓰기
            에필로그
            """.trimIndent()

        assertThat(outline(contents)).containsExactly(
            "1 마침내 GPT-5 등장하다",
            "  1.1 GPT-5 시대의 개막",
            "  1.2 인류의 마지막 시험",
            "2 빅3+1",
            "  2.1 클로드, 코딩과 글쓰기",
        )
    }

    @Test
    fun `a chapter label alone is its own title, and a long title is cut to a post's`() {
        val long = "가".repeat(250)

        val chapters = TocParser.parse("제1장\n1.1 $long")

        assertThat(chapters.single().title).isEqualTo("제1장")
        assertThat(
            chapters
                .single()
                .sections
                .single()
                .title,
        ).hasSize(TocParser.MAX_TITLE)
    }

    @Test
    fun `contents with no chapter read as nothing`() {
        assertThat(TocParser.parse("들어가며\n감사의 글\n1.1 어딘가의 절")).isEmpty()
        assertThat(TocParser.parse("")).isEmpty()
    }

    @Test
    fun `a number that only starts a word is no label`() {
        assertThat(outline("1장 시작\n2024년의 회고\n10년 뒤")).containsExactly("1 시작", "  1.1 2024년의 회고", "  1.2 10년 뒤")
    }
}
