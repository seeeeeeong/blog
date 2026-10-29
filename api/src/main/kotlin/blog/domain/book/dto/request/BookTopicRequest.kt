package blog.domain.book.dto.request

/** The topic a book's new posts go to; null leaves it without one. */
data class BookTopicRequest(
    val topicSlug: String? = null,
)
