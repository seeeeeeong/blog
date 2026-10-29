package blog.book.dto.request

import jakarta.validation.constraints.Pattern

/** The edition a search found, by its YES24 number, and the topic its posts go to, if chosen yet. */
data class BookImportRequest(
    @field:Pattern(regexp = "^[0-9]{1,10}$")
    val sourceRef: String,
    val topicSlug: String? = null,
)
