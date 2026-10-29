package blog.post.entity

/** A post's address: lowercase ASCII words joined by hyphens, as the schema checks. */
object SlugPolicy {
    const val PATTERN = "^[a-z0-9]+(-[a-z0-9]+)*$"
    const val MAX_LENGTH = 100

    // A Korean title has no ASCII words to take; the admin renames the post later.
    private const val FALLBACK = "post"
    private val NOT_A_WORD = Regex("[^a-z0-9]+")

    fun derive(title: String): String =
        title
            .lowercase()
            .replace(NOT_A_WORD, "-")
            .trim('-')
            .take(MAX_LENGTH)
            .trimEnd('-')
            .ifEmpty { FALLBACK }

    /** `post-2` for the second post that would be `post`, still within the length. */
    fun numbered(
        slug: String,
        number: Int,
    ): String {
        val suffix = "-$number"
        return slug.take(MAX_LENGTH - suffix.length).trimEnd('-') + suffix
    }
}
