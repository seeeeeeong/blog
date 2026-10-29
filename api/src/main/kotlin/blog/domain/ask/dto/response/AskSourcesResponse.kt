package blog.domain.ask.dto.response

/** The `sources` event, sent once before the answer's text: the posts it comes from, perhaps none. */
data class AskSourcesResponse(
    val posts: List<AskSourceResponse>,
)
