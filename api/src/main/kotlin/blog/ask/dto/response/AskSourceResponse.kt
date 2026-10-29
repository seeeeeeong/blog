package blog.ask.dto.response

/** A post an answer comes from, for the reader to follow. */
data class AskSourceResponse(
    val slug: String,
    val title: String,
)
