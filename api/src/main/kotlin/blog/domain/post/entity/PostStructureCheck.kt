package blog.domain.post.entity

import blog.domain.post.entity.PostDraftCheck.Finding
import blog.domain.post.entity.PostDraftCheck.Kind

/**
 * The shape every post keeps, read from its MDX outside code fences: an opening that ends in a
 * question, 3 to 5 `##` sections with `## 마무리` last, and a figure in each of the others. The
 * prose's length is only reported. The last section is taken for the closing even under another
 * title, so a missing `## 마무리` is told once, not twice.
 */
object PostStructureCheck {
    const val CLOSING = "마무리"
    const val MIN_SECTIONS = 3
    const val MAX_SECTIONS = 5
    const val MAX_STEPS = 3

    // One concept takes about this much prose; well past it, a post likely holds two.
    const val SHORTEST = 1_000
    const val LONGEST = 1_500
    const val SPLIT = 2_000

    private class Section(
        val title: String,
        val lines: List<String>,
    )

    fun of(body: String): List<Finding> {
        val lines = outsideFences(body)
        val sections = sectionsOf(lines)
        return lines.filter { DEEP_HEADING.matches(it) }.map { Finding(Kind.HEADING_DEPTH, it.trim()) } +
            sectionCount(sections) +
            closing(sections) +
            opening(lines) +
            sections.dropLast(1).filter { it.title != CLOSING }.flatMap(::figure) +
            length(lines)
    }

    private fun outsideFences(body: String): List<String> {
        var fenced = false
        return body.lines().filter { line ->
            val fence = FENCE.matches(line)
            if (fence) fenced = !fenced
            !fence && !fenced
        }
    }

    private fun sectionsOf(lines: List<String>): List<Section> {
        val starts = lines.indices.filter { H2.matches(lines[it]) }
        return starts.mapIndexed { n, start ->
            val end = starts.getOrElse(n + 1) { lines.size }
            Section(lines[start].substringAfter("##").trim(), lines.subList(start + 1, end))
        }
    }

    private fun sectionCount(sections: List<Section>): List<Finding> =
        if (sections.size in MIN_SECTIONS..MAX_SECTIONS) {
            emptyList()
        } else {
            listOf(Finding(Kind.SECTION_COUNT, "${sections.size}개"))
        }

    private fun closing(sections: List<Section>): List<Finding> {
        val last = sections.lastOrNull()?.title
        return if (last == CLOSING) emptyList() else listOf(Finding(Kind.NO_CLOSING, last ?: "섹션 없음"))
    }

    private fun opening(lines: List<String>): List<Finding> {
        val intro = lines.takeWhile { !H2.matches(it) }.filterNot { it.trimStart().startsWith("<") }
        val asks = intro.any { QUESTION.containsMatchIn(it) }
        val first = intro.firstOrNull { it.isNotBlank() }?.trim()?.take(QUOTE) ?: "도입 없음"
        return if (asks) emptyList() else listOf(Finding(Kind.NO_OPENING_QUESTION, first))
    }

    private fun figure(section: Section): List<Finding> {
        val starts = section.lines.map { it.trimStart() }
        val widget = starts.any { line -> PostDraftCheck.WIDGETS.any { line.startsWith("<$it") } }
        val idea = starts.any { it.startsWith("<${PostDraftCheck.IDEA}") }
        val steps = section.lines.count { STEP.matches(it) }
        return when {
            !widget && !idea -> listOf(Finding(Kind.NO_FIGURE, section.title))
            widget && steps !in 1..MAX_STEPS -> listOf(Finding(Kind.TRY_STEPS, "${section.title}: ${steps}개"))
            !widget && steps > 0 -> listOf(Finding(Kind.STEPS_WITHOUT_WIDGET, "${section.title}: ${steps}개"))
            else -> emptyList()
        }
    }

    private fun length(lines: List<String>): List<Finding> {
        val prose =
            lines
                .filterNot { HEADING.matches(it) }
                .joinToString(" ")
                .let { TAG.replace(it, " ") }
                .let { LINK_TARGET.replace(it, "]") }
                .let { MARKS.replace(it, "") }
                .let { SPACES.replace(it, " ").trim() }
        val size = prose.codePointCount(0, prose.length)
        return when {
            size > SPLIT -> listOf(Finding(Kind.LENGTH, "${size}자, 나누기를 검토하세요"))
            size !in SHORTEST..LONGEST -> listOf(Finding(Kind.LENGTH, "${size}자"))
            else -> emptyList()
        }
    }

    private const val QUOTE = 40
    private val FENCE = Regex("""^\s*(```|~~~).*""")
    private val HEADING = Regex("""^#{1,6}\s.*""")
    private val H2 = Regex("""^##\s+\S.*""")
    private val DEEP_HEADING = Regex("""^#{3,6}\s.*""")

    // A Korean question may close with a period: "왜 그럴까요."
    private val QUESTION = Regex("[?？]|(?:까요|나요|가요|는가|을까|일까)\\s*[.。]")
    private val STEP = Regex("""^\s*\d+\.\s.*봅시다[.!]?\s*$""")
    private val TAG = Regex("""</?[A-Za-z][^>]*>""")
    private val LINK_TARGET = Regex("""\]\([^)]*\)""")
    private val MARKS = Regex("""[*`|]|-{3,}""")
    private val SPACES = Regex("""\s+""")
}
