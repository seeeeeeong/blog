package blog.domain.book.dto.request

import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size

/**
 * The edition a search found, by its YES24 number, and the topic its posts go to, if chosen yet.
 * [contents], if pasted, stand in for what YES24 lists.
 */
data class BookImportRequest(
    @field:Pattern(regexp = "^[0-9]{1,10}$")
    val sourceRef: String,
    val topicSlug: String? = null,
    @field:Size(max = BookContentsRequest.MAX_CONTENTS)
    val contents: String? = null,
)
