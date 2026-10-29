package blog.domain.ask.entity

/**
 * Reads the header [AskPrompt] asks every reply to start with, `GROUNDED:` and `SOURCES:` lines, out
 * of the pieces of a streamed answer, and hands on the rest as it comes. A reply without the header
 * is taken as not grounded, with no sources, and is handed on whole.
 */
class AskReplyParser {
    data class Header(
        val grounded: Boolean,
        val slugs: List<String>,
    )

    private val pending = StringBuilder()
    private var grounded: Boolean? = null
    private var slugs: List<String>? = null

    /** Null until the header is read, or found missing. */
    var header: Header? = null
        private set

    /** The part of [piece] that is answer, empty while the header is still coming. */
    fun take(piece: String): String {
        if (header != null) return piece
        pending.append(piece)
        return resolve(ended = false)
    }

    /** The stream has ended: whatever was held back is answer. */
    fun finish(): String = if (header != null) "" else resolve(ended = true)

    private fun resolve(ended: Boolean): String {
        while (true) {
            val end = pending.indexOf("\n")
            if (end < 0) return if (ended || pending.length > MAX_PENDING || isComplete()) conclude() else ""
            val line = pending.substring(0, end)
            val match = KEY.matchEntire(line.trim())
            when {
                line.isBlank() && !isComplete() -> pending.delete(0, end + 1)
                match != null -> read(match).also { pending.delete(0, end + 1) }
                else -> return conclude()
            }
        }
    }

    private fun isComplete() = grounded != null && slugs != null && pending.isNotBlank()

    private fun read(match: MatchResult) {
        val (key, value) = match.destructured
        if (key.equals("GROUNDED", ignoreCase = true)) {
            grounded = value.trim().equals("yes", ignoreCase = true)
        } else {
            slugs =
                value
                    .split(',')
                    .map { it.trim() }
                    .filter { SLUG.matches(it) }
                    .distinct()
                    .take(MAX_SLUGS)
        }
    }

    private fun conclude(): String {
        header = Header(grounded = grounded ?: false, slugs = slugs.orEmpty())
        val rest = pending.toString().trimStart()
        pending.clear()
        return rest
    }

    private companion object {
        // A header is two short lines; past this without a line break, the reply has none.
        const val MAX_PENDING = 300
        const val MAX_SLUGS = 3
        val KEY = Regex("(?i)(GROUNDED|SOURCES)\\s*:(.*)")
        val SLUG = Regex("[a-z0-9]+(-[a-z0-9]+)*")
    }
}
