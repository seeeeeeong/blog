package blog.llm.gateway

import blog.common.exception.BlogError
import blog.common.exception.BlogException
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.MediaType
import org.springframework.http.client.JdkClientHttpRequestFactory
import org.springframework.stereotype.Component
import org.springframework.web.client.ResourceAccessException
import org.springframework.web.client.RestClient
import tools.jackson.core.JacksonException
import tools.jackson.databind.JsonNode
import tools.jackson.databind.json.JsonMapper
import java.net.http.HttpClient
import java.time.Duration

/**
 * DeepSeek's OpenAI-compatible chat completions (api-docs.deepseek.com) on the owner's key, one
 * answer whole rather than streamed. Thinking is off: its tokens bill as output and count against
 * the answer's limit. Never logs the key or the text.
 */
@Component
class DeepSeekLlmGateway(
    @Value("\${blog.deepseek.base-url}") baseUrl: String,
    @Value("\${blog.deepseek.api-key}") private val apiKey: String,
    @Value("\${blog.deepseek.model}") private val model: String,
    @Value("\${blog.deepseek.read-timeout}") readTimeout: Duration,
) : LlmGateway {
    private val log = LoggerFactory.getLogger(javaClass)
    private val json = JsonMapper()

    private val restClient =
        RestClient
            .builder()
            .baseUrl(baseUrl)
            .requestFactory(
                JdkClientHttpRequestFactory(HttpClient.newBuilder().connectTimeout(CONNECT_TIMEOUT).build())
                    .apply { setReadTimeout(readTimeout) },
            ).build()

    override fun complete(chat: LlmChat): LlmReply {
        if (apiKey.isBlank()) throw BlogException(BlogError.LLM_UNAVAILABLE)
        val body =
            mapOf(
                "model" to model,
                "messages" to
                    listOf(
                        mapOf("role" to "system", "content" to chat.system),
                        mapOf("role" to "user", "content" to chat.user),
                    ),
                "max_tokens" to chat.maxTokens,
                "thinking" to mapOf("type" to "disabled"),
                "stream" to false,
            )
        try {
            return restClient
                .post()
                .uri("/chat/completions")
                .header("Authorization", "Bearer $apiKey")
                .contentType(MediaType.APPLICATION_JSON)
                .body(json.writeValueAsBytes(body))
                .exchange { _, response -> replyOf(response.statusCode.value(), response.body.readAllBytes()) }
        } catch (exception: ResourceAccessException) {
            throw BlogException(BlogError.LLM_FAILED, exception)
        }
    }

    private fun replyOf(
        status: Int,
        body: ByteArray,
    ): LlmReply {
        if (status != OK) throw BlogException(errorOf(status))
        return replyOf(answerOf(body))
    }

    private fun answerOf(body: ByteArray): JsonNode =
        try {
            json.readTree(body)
        } catch (exception: JacksonException) {
            throw BlogException(BlogError.LLM_FAILED, exception)
        }

    private fun replyOf(answer: JsonNode): LlmReply {
        val choice = answer.path("choices").path(0)
        val text = choice.path("message").path("content")
        val usage = answer.path("usage")
        val inputTokens = usage.path("prompt_tokens")
        val outputTokens = usage.path("completion_tokens")
        if (!text.isString || !inputTokens.isInt || !outputTokens.isInt) {
            log.warn("DeepSeek answered 200 without a reply or its usage")
            throw BlogException(BlogError.LLM_FAILED)
        }
        return LlmReply(
            text = text.asString(),
            model = answer.text("model") ?: model,
            inputTokens = inputTokens.asInt(),
            outputTokens = outputTokens.asInt(),
            finished = choice.text("finish_reason") == STOP,
        )
    }

    private fun errorOf(status: Int): BlogError {
        log.warn("DeepSeek answered {}", status)
        return when (status) {
            UNAUTHORIZED, PAYMENT_REQUIRED, FORBIDDEN -> BlogError.LLM_UNAVAILABLE
            TOO_MANY_REQUESTS -> BlogError.LLM_BUSY
            else -> BlogError.LLM_FAILED
        }
    }

    private fun JsonNode.text(name: String): String? =
        path(name)
            .takeIf { it.isString }
            ?.asString()
            ?.takeIf { it.isNotBlank() }

    private companion object {
        // A TCP and TLS handshake with a healthy API takes well under a second; three allows a slow link.
        val CONNECT_TIMEOUT: Duration = Duration.ofSeconds(3)
        const val STOP = "stop"
        const val OK = 200
        const val UNAUTHORIZED = 401

        // The account's balance ran out.
        const val PAYMENT_REQUIRED = 402
        const val FORBIDDEN = 403
        const val TOO_MANY_REQUESTS = 429
    }
}
