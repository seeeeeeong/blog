package blog.domain.llm.entity

/** What a call was for. Writing a draft and reviewing it share a monthly cap; Ask has its own. */
enum class LlmPurpose {
    MEMO,
    REVIEW,
    ASK,
}
