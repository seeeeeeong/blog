package blog.ask.service

import blog.ask.dto.request.AskRequest
import blog.ask.dto.response.AskDoneResponse
import blog.ask.dto.response.AskSourceResponse
import blog.ask.dto.response.AskSourcesResponse
import blog.ask.entity.AskLimitPolicy
import blog.ask.entity.AskMessage
import blog.ask.entity.AskPrompt
import blog.ask.entity.AskReplyParser
import blog.ask.entity.AskRole
import blog.ask.repository.JdbcAskDailyUsage
import blog.ask.repository.JdbcAskMessages
import blog.common.exception.BlogError
import blog.common.exception.BlogException
import blog.common.util.UuidV7
import blog.common.web.ClientIp
import blog.common.web.EventStream
import blog.llm.dto.request.LlmRequest
import blog.llm.service.LlmService
import blog.post.dto.response.PostSourceResponse
import blog.post.service.PostService
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.security.SecureRandom
import java.time.Clock
import java.util.UUID

/**
 * A reader's question, answered by the model from the post they are on or, on the home page, by
 * the posts whose titles and summaries cover it. Each reader has a daily number of questions, and
 * Ask a monthly cap. Questions and answers are logged with nothing that names the reader. No
 * transaction is held while the model answers.
 */
@Service
class AskService(
    private val postService: PostService,
    private val llmService: LlmService,
    private val jdbcAskDailyUsage: JdbcAskDailyUsage,
    private val jdbcAskMessages: JdbcAskMessages,
    @Value("\${blog.ask.ip-salt}") ipSalt: String,
    private val clock: Clock,
) {
    private val ipKey: ByteArray =
        ipSalt.takeIf { it.isNotBlank() }?.toByteArray(Charsets.UTF_8)
            ?: ByteArray(RANDOM_KEY_BYTES).also { SecureRandom().nextBytes(it) }

    /** What the model is asked, and what the answer may name as its sources. */
    private class Material(
        val prompt: AskPrompt.Messages,
        val post: PostSourceResponse?,
        val listed: Map<String, AskSourceResponse>,
    )

    /**
     * Streams the answer to [events]: `sources`, then its `text`, then `done`. Everything that refuses
     * a question (no such post, Ask closed or at its cap, the reader's day used up) comes first, as a
     * status of its own.
     */
    fun ask(
        request: AskRequest,
        clientIp: ClientIp,
        events: EventStream,
    ) {
        val material = materialOf(request)
        llmService.check(LlmRequest.Purpose.ASK)
        take(clientIp)
        val conversationId = request.conversationId ?: UuidV7.at(clock.instant())
        val question =
            AskMessage(
                conversationId = conversationId,
                postId = material.post?.id,
                role = AskRole.USER,
                content = request.question.trim(),
                grounded = null,
                now = clock.instant(),
            )
        jdbcAskMessages.append(question)
        events.stream { answer(material, question, events) }
    }

    private fun materialOf(request: AskRequest): Material {
        val history = request.history.map { AskPrompt.Turn(fromReader = it.fromReader, content = it.content) }
        val question = request.question.trim()
        val slug = request.postSlug
        if (slug != null) {
            val post = postService.source(slug)
            val prompt =
                AskPrompt.forPost(
                    title = post.title,
                    bodyMdx = post.bodyMdx,
                    history = history,
                    question = question,
                )
            return Material(prompt = prompt, post = post, listed = emptyMap())
        }
        val posts = postService.list().take(AskPrompt.MAX_LISTED)
        val listed = posts.map { AskPrompt.Listed(slug = it.slug, title = it.title, summary = it.summary) }
        val prompt = AskPrompt.forBlog(listed, history, question)
        return Material(
            prompt = prompt,
            post = null,
            listed =
                posts.associate {
                    it.slug to
                        AskSourceResponse(it.slug, it.title)
                },
        )
    }

    private fun take(clientIp: ClientIp) {
        val day = AskLimitPolicy.dayOf(clock.instant())
        val ipHash = AskLimitPolicy.ipHash(ipKey, clientIp.address, day)
        if (!jdbcAskDailyUsage.take(ipHash, day, AskLimitPolicy.DAILY_QUESTIONS)) {
            throw BlogException(BlogError.ASK_DAILY_LIMIT_REACHED)
        }
    }

    private fun answer(
        material: Material,
        question: AskMessage,
        events: EventStream,
    ) {
        val request =
            LlmRequest(
                purpose = LlmRequest.Purpose.ASK,
                system = material.prompt.system,
                user = material.prompt.user,
                maxTokens = AskPrompt.MAX_TOKENS,
            )
        val answer = Answer(material, events)
        llmService.stream(request, answer::take)
        answer.finish()
        // Only a header, and nothing to say.
        if (answer.text.isBlank()) throw BlogException(BlogError.LLM_INCOMPLETE)
        val message =
            AskMessage(
                conversationId = question.conversationId,
                postId = question.postId,
                role = AskRole.ASSISTANT,
                content = answer.text,
                grounded = answer.grounded,
                now = clock.instant(),
            )
        jdbcAskMessages.append(message)
        events.done(AskDoneResponse(grounded = answer.grounded, conversationId = question.conversationId))
    }

    /** The reply as the reader sees it: its header read off into `sources`, then the answer's text. */
    private class Answer(
        private val material: Material,
        private val events: EventStream,
    ) {
        private val parser = AskReplyParser()
        private val shown = StringBuilder()
        private var announced = false

        var grounded = false
            private set

        val text: String get() = shown.toString()

        fun take(piece: String) = show(parser.take(piece))

        fun finish() = show(parser.finish())

        private fun show(text: String) {
            val header = parser.header ?: return
            if (!announced) announce(header)
            if (text.isEmpty()) return
            shown.append(text)
            events.text(text)
        }

        private fun announce(header: AskReplyParser.Header) {
            announced = true
            val post = material.post
            val sources =
                if (post != null) {
                    listOfNotNull(AskSourceResponse(post.slug, post.title).takeIf { header.grounded })
                } else {
                    header.slugs.mapNotNull { material.listed[it] }
                }
            grounded = header.grounded && sources.isNotEmpty()
            events.send(SOURCES, AskSourcesResponse(sources))
            if (!grounded) {
                shown.append(AskPrompt.NOT_IN_POSTS)
                events.text(AskPrompt.NOT_IN_POSTS)
            }
        }
    }

    private companion object {
        const val SOURCES = "sources"
        const val RANDOM_KEY_BYTES = 32
    }
}
