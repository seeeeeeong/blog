package blog.common.util

/**
 * Text handed to a model as data, between `<tag>` lines the system prompt names. A tag of the same
 * name inside the text is defused, so the material cannot close its own block and speak as rules.
 */
object MaterialPrompt {
    fun wrap(
        tag: String,
        text: String,
    ): String {
        require(TAG.matches(tag)) { "A tag is lowercase letters" }
        val inner = Regex("""(?i)<(\s*/?\s*$tag\b)""").replace(text) { "&lt;${it.groupValues[1]}" }
        return "<$tag>\n${inner.trim()}\n</$tag>"
    }

    private val TAG = Regex("[a-z]+")
}
