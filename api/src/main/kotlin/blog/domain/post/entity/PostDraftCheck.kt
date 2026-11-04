package blog.domain.post.entity

/**
 * What can be checked of a draft without a model: the memo's code and numbers are still there, no
 * link appeared from nowhere, and the text keeps to what the blog renders. A finding is for the
 * admin to look at; a correction may rightly change what the memo said.
 */
object PostDraftCheck {
    enum class Kind {
        MEMO_CODE_CHANGED,
        MEMO_NUMBER_MISSING,
        LINK_ADDED,
        NOT_RENDERABLE,
    }

    data class Finding(
        val kind: Kind,
        val detail: String,
    )

    fun of(
        memo: String,
        body: String,
    ): List<Finding> = memoCode(memo, body) + memoNumbers(memo, body) + links(memo, body) + rendering(body)

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

    private fun rendering(body: String): List<Finding> {
        val prose = proseOf(body)
        val problems =
            buildList {
                if (body.split("```").size % 2 == 0) add("닫히지 않은 코드 블록")
                if (TITLE.containsMatchIn(prose)) add("# 제목")
                if (TABLE.containsMatchIn(prose)) add("표")
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
    private val TITLE = Regex("""^# """, RegexOption.MULTILINE)
    private val TABLE = Regex("""^\s*\|.*\|\s*$""", RegexOption.MULTILINE)
    private val MODULE = Regex("""^(import|export)\s""", RegexOption.MULTILINE)
    private const val TAGS = "Callout|Mark|HandshakeWidget|Seek|ScenarioLink|WidgetIdea"
    private val KNOWN_TAG = Regex("""</?(?:$TAGS)\b[^>]*>""")
    private val UNKNOWN_TAG = Regex("""<(?!/?(?:$TAGS)\b)[^\s>]+>?""")
}
