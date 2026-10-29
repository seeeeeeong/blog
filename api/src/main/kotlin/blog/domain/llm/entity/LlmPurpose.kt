package blog.domain.llm.entity

/** What a call was for. A study note and a draft from a memo share one monthly cap; Ask has its own. */
enum class LlmPurpose {
    NOTE,
    MEMO,
    ASK,
}
