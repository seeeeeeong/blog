package blog.domain.post.entity

/**
 * What can be checked of a draft without a model: the memo's code and numbers are still there, no
 * link appeared from nowhere, and the text keeps to what the blog renders. [PostStructureCheck] adds
 * the post's shape. An error or a warning goes back to the model once; an info is for the admin,
 * since a correction may rightly change what the memo said.
 */
object PostDraftCheck {
    enum class Severity {
        ERROR,
        WARNING,
        INFO,
    }

    /** Each finding's kind, with what is wrong and how the model should fix it, in Korean. */
    enum class Kind(
        val severity: Severity,
        val problem: String,
        val fix: String,
    ) {
        NOT_RENDERABLE(
            Severity.ERROR,
            "블로그가 렌더하지 못하는 MDX가 있습니다",
            "허용된 문법과 컴포넌트만 남기세요",
        ),
        HEADING_DEPTH(
            Severity.WARNING,
            "`###` 이하 제목이 있습니다",
            "제목을 지워 앞 섹션의 문단으로 합치거나, 따로 설명할 만하면 `##` 섹션으로 올리세요",
        ),
        SECTION_COUNT(
            Severity.WARNING,
            "`##` 섹션이 `## 마무리`를 포함해 3~5개가 아닙니다",
            "새 내용을 쓰지 말고 섹션을 나누거나 합쳐 3~5개로 맞추세요",
        ),
        NO_CLOSING(
            Severity.WARNING,
            "마지막 섹션이 `## 마무리`가 아닙니다",
            "핵심을 한두 문장으로 정리하는 `## 마무리`를 마지막 섹션으로 두세요",
        ),
        NO_OPENING_QUESTION(
            Severity.WARNING,
            "첫 `##` 앞 도입에 질문이 없습니다",
            "도입을 구체적인 사례로 시작해, 이 글이 답할 질문을 물음표로 끝나는 문장으로 쓰고 끝내세요. 메모에 없는 사례는 가정으로 쓰세요",
        ),
        NO_FIGURE(
            Severity.WARNING,
            "그림이 없는 섹션이 있습니다",
            "맞는 위젯이 없으면 그 섹션에 `<WidgetIdea note=\"보여 줄 것과 독자가 해 볼 것\" />`을 한 줄로 두세요",
        ),
        TRY_STEPS(
            Severity.WARNING,
            "위젯 아래 '~해 봅시다' 단계가 1~3개가 아닙니다",
            "위젯 바로 아래에 위젯으로 해 볼 일을 번호 목록 1~3개로 두고, 각 항목을 ~해 봅시다로 끝내세요",
        ),
        STEPS_WITHOUT_WIDGET(
            Severity.WARNING,
            "독자에게 보이지 않는 그림에 '~해 봅시다' 단계가 있습니다",
            "`<WidgetIdea>`는 화면에 나오지 않으니 단계를 지우고, 해 볼 일은 note에 쓰세요",
        ),
        LINK_UNKNOWN(
            Severity.WARNING,
            "발행된 글 목록에 없는 글로 링크했습니다",
            "링크를 지우고 글자만 남기세요",
        ),
        MEMO_CODE_CHANGED(Severity.INFO, "메모의 코드가 바뀌었습니다", "메모의 코드를 그대로 옮기세요"),
        MEMO_NUMBER_MISSING(Severity.INFO, "메모의 숫자가 빠졌습니다", "메모의 숫자를 살리세요"),
        LINK_ADDED(Severity.INFO, "메모에 없는 링크가 생겼습니다", "링크가 맞는지 확인하세요"),
        LENGTH(Severity.INFO, "본문이 코드를 빼고 1,000~1,500자가 아닙니다", "한 글에 한 개념만 다루세요"),
    }

    data class Finding(
        val kind: Kind,
        val detail: String,
    ) {
        val severity: Severity get() = kind.severity
    }

    /** The widgets that draw a figure; `<Seek>` and `<ScenarioLink>` only steer one. */
    val WIDGETS = listOf("HandshakeWidget")

    /** A note for the owner where a figure would go; it renders nothing. */
    const val IDEA = "WidgetIdea"

    /** [published] holds the slugs a draft may link to as `/posts/<slug>`. */
    fun of(
        memo: String,
        body: String,
        published: Collection<String> = emptyList(),
    ): List<Finding> =
        memoCode(memo, body) + memoNumbers(memo, body) + links(memo, body) + posts(body, published) + rendering(body)

    /** A finding as the one rewrite is told it: what is wrong, where, and how to fix it. */
    fun problemOf(finding: Finding): String = "${finding.kind.problem} (\"${finding.detail}\"): ${finding.kind.fix}"

    private fun memoCode(
        memo: String,
        body: String,
    ): List<Finding> {
        val written = FENCE.findAll(body).map { squeeze(it.groupValues[1]) }.toList()
        return FENCE
            .findAll(memo)
            .map { it.groupValues[1] }
            .filterNot { code -> written.any { squeeze(code) in it } }
            .map { Finding(Kind.MEMO_CODE_CHANGED, it.trim().lineSequence().first()) }
            .toList()
    }

    private fun memoNumbers(
        memo: String,
        body: String,
    ): List<Finding> {
        val written = numbersIn(body)
        return numbersIn(proseOf(memo)).filterNot { it in written }.map { Finding(Kind.MEMO_NUMBER_MISSING, it) }
    }

    private fun links(
        memo: String,
        body: String,
    ): List<Finding> =
        LINK
            .findAll(body)
            .map { it.value }
            .distinct()
            .filterNot { it in memo }
            .map { Finding(Kind.LINK_ADDED, it) }
            .toList()

    private fun posts(
        body: String,
        published: Collection<String>,
    ): List<Finding> =
        POST_LINK
            .findAll(proseOf(body))
            .map { it.groupValues[1] }
            .distinct()
            .filterNot { it in published }
            .map { Finding(Kind.LINK_UNKNOWN, "/posts/$it") }
            .toList()

    private fun rendering(body: String): List<Finding> {
        val prose = proseOf(body)
        val problems =
            buildList {
                if (body.split("```").size % 2 == 0) add("닫히지 않은 코드 블록")
                if (TITLE.containsMatchIn(prose)) add("# 제목")
                if (MODULE.containsMatchIn(prose)) add("import 또는 export")
                if ('{' in KNOWN_TAG.replace(prose, "")) add("중괄호")
                UNKNOWN_TAG
                    .findAll(prose)
                    .map { it.value }
                    .distinct()
                    .forEach { add(it) }
            }
        return problems.map { Finding(Kind.NOT_RENDERABLE, it) }
    }

    private fun numbersIn(text: String): List<String> =
        NUMBER
            .findAll(text)
            .map { it.value }
            .distinct()
            .toList()

    private fun proseOf(text: String): String = INLINE_CODE.replace(FENCE.replace(text, ""), "")

    private fun squeeze(code: String): String = SPACES.replace(code, " ").trim()

    private val FENCE = Regex("""```[^\n]*\n(.*?)```""", RegexOption.DOT_MATCHES_ALL)
    private val INLINE_CODE = Regex("`[^`\n]*`")
    private val SPACES = Regex("""\s+""")
    private val NUMBER = Regex("""(?<![\d.])\d+(?:\.\d+)?(?![\d.])""")
    private val LINK = Regex("""https?://[^\s)>"'`]+""")
    private val POST_LINK = Regex("""\]\(/posts/([^)\s#?]+)[^)]*\)""")
    private val TITLE = Regex("""^# """, RegexOption.MULTILINE)
    private val MODULE = Regex("""^(import|export)\s""", RegexOption.MULTILINE)
    private val TAGS =
        (listOf("Callout", "Mark", "Tone", "Seek", "ScenarioLink", IDEA) + WIDGETS)
            .joinToString("|")
    private val KNOWN_TAG = Regex("""</?(?:$TAGS)\b[^>]*>""")
    private val UNKNOWN_TAG = Regex("""<(?!/?(?:$TAGS)\b)[^\s>]+>?""")
}
