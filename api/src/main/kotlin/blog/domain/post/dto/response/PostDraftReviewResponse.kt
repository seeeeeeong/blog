package blog.domain.post.dto.response

/** What a separate call found comparing a draft with its memo, for the admin to read before publishing. */
data class PostDraftReviewResponse(
    val addedFacts: List<AddedFact> = emptyList(),
    val corrections: List<Correction> = emptyList(),
    val invented: List<Invented> = emptyList(),
    val dropped: List<String> = emptyList(),
    val critical: List<Critical> = emptyList(),
) {
    enum class Confidence {
        HIGH,
        LOW,
    }

    data class AddedFact(
        val claim: String,
        val quote: String,
        val confidence: Confidence,
    )

    data class Correction(
        val memo: String,
        val draft: String,
        val reason: String,
    )

    data class Invented(
        val quote: String,
        val reason: String,
    )

    data class Critical(
        val problem: String,
        val quote: String,
        val fix: String,
    )
}
