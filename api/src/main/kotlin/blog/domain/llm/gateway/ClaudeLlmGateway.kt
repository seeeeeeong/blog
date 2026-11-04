package blog.domain.llm.gateway

import blog.common.exception.BlogError
import blog.common.exception.BlogException
import com.anthropic.client.AnthropicClient
import com.anthropic.client.okhttp.AnthropicOkHttpClient
import com.anthropic.core.JsonValue
import com.anthropic.core.Timeout
import com.anthropic.errors.AnthropicException
import com.anthropic.errors.AnthropicServiceException
import com.anthropic.models.beta.messages.BetaOutputConfig
import com.anthropic.models.beta.messages.BetaRawMessageStreamEvent
import com.anthropic.models.beta.messages.BetaStopReason
import com.anthropic.models.beta.messages.MessageCreateParams
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import java.time.Duration

/**
 * Claude on the owner's key, streamed through Anthropic's SDK. A request its safety classifiers
 * decline, as benign security writing can be, runs again on the model Anthropic recommends for it;
 * a refusal that still comes back counts as an unfinished answer. Never logs the key or the text.
 */
@Component
class ClaudeLlmGateway(
    @Value("\${blog.claude.base-url}") private val baseUrl: String,
    @Value("\${blog.claude.api-key}") private val apiKey: String,
    @Value("\${blog.claude.idle-timeout}") private val idleTimeout: Duration,
) : LlmGateway {
    private val log = LoggerFactory.getLogger(javaClass)

    // Built on first use: the SDK refuses a blank key, which only means Claude is not set up.
    private val client: AnthropicClient by lazy {
        AnthropicOkHttpClient
            .builder()
            .apiKey(apiKey)
            .baseUrl(baseUrl)
            .timeout(
                Timeout
                    .builder()
                    .connect(CONNECT_TIMEOUT)
                    .read(idleTimeout)
                    .request(WHOLE_ANSWER)
                    .build(),
            ).build()
    }

    override val configured: Boolean get() = apiKey.isNotBlank()

    override fun serves(model: String): Boolean = model.startsWith(PREFIX)

    /** What the stream has given so far. */
    private class Received {
        val text = StringBuilder()
        var model: String? = null
        var stop: BetaStopReason? = null
        var inputTokens: Long? = null
        var outputTokens: Long? = null
    }

    override fun stream(
        chat: LlmChat,
        onText: (String) -> Unit,
    ): LlmReply {
        if (!configured) throw BlogException(BlogError.LLM_UNAVAILABLE)
        val received = Received()
        read(chat, received, onText)
        return replyOf(received, chat.model)
    }

    private fun read(
        chat: LlmChat,
        received: Received,
        onText: (String) -> Unit,
    ) {
        try {
            client.beta().messages().createStreaming(paramsOf(chat)).use { response ->
                response.stream().forEach { take(it, received, onText) }
            }
        } catch (exception: AnthropicServiceException) {
            throw BlogException(errorOf(exception.statusCode()), exception)
        } catch (exception: AnthropicException) {
            // Refused, dropped, or quiet past the idle timeout.
            throw BlogException(BlogError.LLM_FAILED, exception)
        }
    }

    private fun paramsOf(chat: LlmChat): MessageCreateParams =
        MessageCreateParams
            .builder()
            .model(chat.model)
            .maxTokens(chat.maxTokens.toLong())
            .system(chat.system)
            .addUserMessage(chat.user)
            // The effort the owner's comparison of models was measured at; both current models think adaptively.
            .outputConfig(BetaOutputConfig.builder().effort(BetaOutputConfig.Effort.HIGH).build())
            .addBeta(FALLBACK_BETA)
            .putAdditionalBodyProperty("fallbacks", JsonValue.from("default"))
            .build()

    private fun take(
        event: BetaRawMessageStreamEvent,
        received: Received,
        onText: (String) -> Unit,
    ) {
        event.messageStart().ifPresent { start ->
            received.model = start.message().model().asString()
            received.inputTokens = start.message().usage().inputTokens()
        }
        event.contentBlockDelta().flatMap { it.delta().text() }.ifPresent { delta ->
            received.text.append(delta.text())
            onText(delta.text())
        }
        event.messageDelta().ifPresent { delta ->
            delta.delta().stopReason().ifPresent { received.stop = it }
            received.outputTokens = delta.usage().outputTokens()
            delta.usage().inputTokens().ifPresent { received.inputTokens = it }
        }
    }

    private fun replyOf(
        received: Received,
        asked: String,
    ): LlmReply {
        val inputTokens = received.inputTokens
        val outputTokens = received.outputTokens
        if (received.stop == null || inputTokens == null || outputTokens == null) {
            log.warn("Claude's stream ended without its stop reason or usage")
            throw BlogException(BlogError.LLM_FAILED)
        }
        return LlmReply(
            text = received.text.toString(),
            model = received.model ?: asked,
            inputTokens = inputTokens.toInt(),
            outputTokens = outputTokens.toInt(),
            finished = received.stop == BetaStopReason.END_TURN,
        )
    }

    private fun errorOf(status: Int): BlogError {
        log.warn("Claude answered {}", status)
        return when (status) {
            UNAUTHORIZED, BILLING, FORBIDDEN -> BlogError.LLM_UNAVAILABLE
            TOO_MANY_REQUESTS, OVERLOADED -> BlogError.LLM_BUSY
            else -> BlogError.LLM_FAILED
        }
    }

    private companion object {
        const val PREFIX = "claude-"
        const val FALLBACK_BETA = "server-side-fallback-2026-07-01"

        // A TCP and TLS handshake with a healthy API takes well under a second; three allows a slow link.
        val CONNECT_TIMEOUT: Duration = Duration.ofSeconds(3)

        // The idle timeout is what catches a dead stream; this only bounds a very long post.
        val WHOLE_ANSWER: Duration = Duration.ofMinutes(10)
        const val UNAUTHORIZED = 401
        const val BILLING = 402
        const val FORBIDDEN = 403
        const val TOO_MANY_REQUESTS = 429
        const val OVERLOADED = 529
    }
}
