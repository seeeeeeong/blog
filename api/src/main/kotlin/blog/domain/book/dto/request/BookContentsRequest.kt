package blog.domain.book.dto.request

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

/** Contents the admin pasted for a book YES24 lists none for, to see how they read. */
data class BookContentsRequest(
    @field:NotBlank
    @field:Size(max = MAX_CONTENTS)
    val contents: String,
) {
    companion object {
        // The longest contents seen from YES24 run to about 15,000 characters.
        const val MAX_CONTENTS = 50_000
    }
}
