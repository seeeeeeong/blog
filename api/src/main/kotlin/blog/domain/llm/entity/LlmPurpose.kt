package blog.domain.llm.entity

/** What a call was for. A draft from a memo and Ask each have a monthly cap of their own. */
enum class LlmPurpose {
    MEMO,
    ASK,
}
