package blog.llm.gateway

/**
 * A language model outside the blog, asked one question and answered whole. A failure is a
 * `BlogException` with an `llm.*` error.
 */
interface LlmGateway {
    fun complete(chat: LlmChat): LlmReply
}
