package blog.book.entity

/**
 * A book's contents, one item a line, read into the study path: chapters and their sections. A
 * part only groups chapters and a deeper item belongs to its section's post, so both are left out,
 * as is anything before the first chapter. A chapter whose sections have no numbers gets them in
 * order ("3.1", "3.2"); one with numbered sections keeps those and drops its unnumbered lines.
 */
object TocParser {
    // A post's title, which a section's becomes.
    const val MAX_TITLE = 200

    data class Chapter(
        val number: String,
        val title: String,
        val sections: List<Section>,
    )

    data class Section(
        val number: String,
        val title: String,
    )

    // A label ends at a space, a separator or the end of the line, so "1장" is one and "10년" is not.
    private const val END = """(?=[\s.:)]|$)"""

    // A Roman numeral as one character (Ⅰ to Ⅻ) numbers nothing but a part.
    private val PART = Regex("""^(?:(?:제\s*)?(?:\d{1,3}|[IVX]+)\s*부|(?i:part)\s+(?:\d{1,3}|[IVX]+)|[Ⅰ-Ⅻ]+)$END""")
    private val CHAPTER = Regex("""^(?:(?:제\s*)?(\d{1,3})\s*장|(?i:chapter)\s+(\d{1,3}))$END""")
    private val APPENDIX = Regex("""^(?:부록|(?i:appendix))\s*([A-Z])$END""")
    private val DOTTED = Regex("""^(\d{1,3}|[A-Z])\.(\d{1,3})((?:\.\d+)*)\.?(?=\s|$)""")
    private val BARE = Regex("""^(\d{1,3})(\.?)(?=\s|$)""")
    private val SEPARATOR = Regex("""^[\s.:)\-–—]+""")

    // What follows the last chapter and belongs to none.
    private val BACK_MATTER =
        Regex(
            """^(?:마치며|나가며|맺음말|에필로그|후기|부록|찾아보기|색인|참고\s*문헌|감사의\s*[글말]|용어집|""" +
                """(?i:epilogue|afterword|appendix|index|bibliography|references|glossary))$END""",
        )

    /** Empty when no line reads as a chapter. */
    fun parse(contents: String): List<Chapter> {
        val chapters = mutableListOf<Draft>()
        for (raw in contents.lines()) {
            val indent = raw.takeWhile { it.isWhitespace() }.length
            val text = raw.filterNot { it.isISOControl() }.trim()
            val current = chapters.lastOrNull()
            if (text.isEmpty() || PART.containsMatchIn(text)) continue
            val chapter = chapterOf(text, indent, current)
            when {
                chapter != null -> chapters += chapter
                current != null -> current.add(text, indent)
            }
        }
        return chapters.map(Draft::chapter)
    }

    // In contents whose chapters say "장" or "Chapter", a bare number ("01. 티켓 판매") is a section.
    private fun chapterOf(
        text: String,
        indent: Int,
        current: Draft?,
    ): Draft? {
        val chapter = CHAPTER.find(text)
        val appendix = APPENDIX.find(text)
        val bare = bareOf(text, indent)?.takeIf { current?.labelled != true }
        return when {
            chapter != null -> {
                val number = chapter.groupValues[1].ifEmpty { chapter.groupValues[2] }
                Draft(number = plain(number), title = titleOf(text, chapter), labelled = true)
            }

            appendix != null -> {
                Draft(number = appendix.groupValues[1], title = titleOf(text, appendix), labelled = true)
            }

            bare != null -> {
                Draft(number = plain(bare.groupValues[1]), title = titleOf(text, bare), labelled = false)
            }

            else -> {
                null
            }
        }
    }

    // An indented bare number with no dot, as in "3 Ways to Win", starts a title.
    private fun bareOf(
        text: String,
        indent: Int,
    ): MatchResult? = BARE.find(text)?.takeIf { it.groupValues[2].isNotEmpty() || indent == 0 }

    private fun titleOf(
        text: String,
        label: MatchResult,
    ): String {
        val title = text.substring(label.range.last + 1).replace(SEPARATOR, "").trim()
        return clip(title.ifEmpty { text })
    }

    private fun clip(text: String): String {
        val end = text.offsetByCodePoints(0, minOf(MAX_TITLE, text.codePointCount(0, text.length)))
        return text.substring(0, end).trim()
    }

    private fun plain(number: String): String = number.toInt().toString()

    private class Draft(
        val number: String,
        val title: String,
        val labelled: Boolean,
    ) {
        private val numbered = mutableListOf<Section>()

        // Lines without a number, by indent: the shallowest are the sections, when nothing is numbered.
        private val loose = mutableListOf<Pair<Int, String>>()

        fun add(
            text: String,
            indent: Int,
        ) {
            val dotted = DOTTED.find(text)
            val bare = bareOf(text, indent)
            when {
                dotted != null -> {
                    // 1.2.3 and deeper belong to section 1.2's post.
                    val (major, minor, deeper) = dotted.destructured
                    if (deeper.isEmpty()) {
                        val chapter = if (major[0].isDigit()) plain(major) else major
                        numbered += Section("$chapter.${plain(minor)}", titleOf(text, dotted))
                    }
                }

                bare != null -> {
                    numbered += Section("$number.${plain(bare.groupValues[1])}", titleOf(text, bare))
                }

                !BACK_MATTER.containsMatchIn(text) -> {
                    loose += indent to clip(text)
                }
            }
        }

        fun chapter(): Chapter {
            val sections =
                numbered.ifEmpty {
                    val top = loose.minOfOrNull { it.first }
                    loose
                        .filter { it.first == top }
                        .mapIndexed { index, (_, title) -> Section("$number.${index + 1}", title) }
                }
            return Chapter(number = number, title = title, sections = sections)
        }
    }
}
