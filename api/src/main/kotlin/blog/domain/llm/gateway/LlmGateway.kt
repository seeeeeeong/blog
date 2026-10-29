package blog.domain.llm.gateway

/**
 * A language model outside the blog, asked one question. The answer streams: [stream] hands each
 * piece to `onText` as it comes and returns the whole reply at the end. A failure is a
 * `BlogException` with an `llm.*` error.
 */
interface LlmGateway {
    /** False when the blog has no key for the model, so nothing can be asked. */
    val configured: Boolean

    fun stream(
        chat: LlmChat,
        onText: (String) -> Unit,
    ): LlmReply
}
