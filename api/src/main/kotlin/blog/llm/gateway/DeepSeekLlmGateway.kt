package blog.llm.gateway

import blog.common.exception.BlogError
import blog.common.exception.BlogException
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import tools.jackson.core.JacksonException
import tools.jackson.databind.JsonNode
import tools.jackson.databind.json.JsonMapper
import java.io.BufferedReader
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URI
import java.time.Duration

/**
 * DeepSeek's OpenAI-compatible chat completions (api-docs.deepseek.com) on the owner's key,
 * streamed. Plain HttpURLConnection: its read timeout is an idle timeout between pieces, which a
 * stream needs and the JDK's HttpClient lacks. Thinking is off: its tokens bill as output and count
 * against the answer's limit. Never logs the key or the text.
 */
@Component
class DeepSeekLlmGateway(
    @Value("\${blog.deepseek.base-url}") private val baseUrl: String,
    @Value("\${blog.deepseek.api-key}") private val apiKey: String,
    @Value("\${blog.deepseek.model}") private val model: String,
    @Value("\${blog.deepseek.idle-timeout}") private val idleTimeout: Duration,
) : LlmGateway {
    private val log = LoggerFactory.getLogger(javaClass)
    private val json = JsonMapper()

    override val configured: Boolean get() = apiKey.isNotBlank()

    /** What the stream has given so far. */
    private class Received {
        val text = StringBuilder()
        var model: String? = null
        var finish: String? = null
        var inputTokens: Int? = null
        var outputTokens: Int? = null
    }

    override fun stream(
        chat: LlmChat,
        onText: (String) -> Unit,
    ): LlmReply {
        if (!configured) throw BlogException(BlogError.LLM_UNAVAILABLE)
        val connection = connectionFor(bodyOf(chat))
        try {
            checkStatus(connection)
            val received = Received()
            connection.inputStream.bufferedReader(Charsets.UTF_8).use { read(it, received, onText) }
            return replyOf(received)
        } catch (exception: IOException) {
            // Refused, dropped, or quiet past the idle timeout.
            throw BlogException(BlogError.LLM_FAILED, exception)
        } finally {
            connection.disconnect()
        }
    }

    private fun bodyOf(chat: LlmChat): ByteArray =
        json.writeValueAsBytes(
            mapOf(
                "model" to model,
                "messages" to
                    listOf(
                        mapOf("role" to "system", "content" to chat.system),
                        mapOf("role" to "user", "content" to chat.user),
                    ),
                "max_tokens" to chat.maxTokens,
                "thinking" to mapOf("type" to "disabled"),
                "stream" to true,
                // The last piece then carries the tokens, which the cap is counted in.
                "stream_options" to mapOf("include_usage" to true),
            ),
        )

    private fun connectionFor(body: ByteArray): HttpURLConnection {
        val connection = URI("$baseUrl/chat/completions").toURL().openConnection() as HttpURLConnection
        connection.requestMethod = "POST"
        connection.doOutput = true
        connection.setFixedLengthStreamingMode(body.size)
        connection.connectTimeout = CONNECT_TIMEOUT.toMillis().toInt()
        connection.readTimeout = idleTimeout.toMillis().toInt()
        connection.setRequestProperty("Authorization", "Bearer $apiKey")
        connection.setRequestProperty("Content-Type", "application/json")
        connection.setRequestProperty("Accept", "text/event-stream")
        try {
            connection.outputStream.use { it.write(body) }
        } catch (exception: IOException) {
            connection.disconnect()
            throw BlogException(BlogError.LLM_FAILED, exception)
        }
        return connection
    }

    private fun checkStatus(connection: HttpURLConnection) {
        val status = connection.responseCode
        if (status != OK) throw BlogException(errorOf(status))
    }

    private fun read(
        reader: BufferedReader,
        received: Received,
        onText: (String) -> Unit,
    ) {
        for (line in reader.lineSequence()) {
            // A blank line ends an event; one starting with ':' is a comment, as DeepSeek's keep-alive.
            val data = line.takeIf { it.startsWith(DATA) }?.removePrefix(DATA)?.trim() ?: continue
            if (data == DONE) return
            take(eventOf(data), received, onText)
        }
    }

    private fun eventOf(data: String): JsonNode =
        try {
            json.readTree(data)
        } catch (exception: JacksonException) {
            throw BlogException(BlogError.LLM_FAILED, exception)
        }

    private fun take(
        event: JsonNode,
        received: Received,
        onText: (String) -> Unit,
    ) {
        event.text("model")?.let { received.model = it }
        val choice = event.path("choices").path(0)
        choice
            .path("delta")
            .path("content")
            .takeIf { it.isString }
            ?.asString()
            ?.takeIf { it.isNotEmpty() }
            ?.let { piece ->
                received.text.append(piece)
                onText(piece)
            }
        choice.text("finish_reason")?.let { received.finish = it }
        val usage = event.path("usage")
        val input = usage.path("prompt_tokens")
        val output = usage.path("completion_tokens")
        if (input.isInt && output.isInt) {
            received.inputTokens = input.asInt()
            received.outputTokens = output.asInt()
        }
    }

    private fun replyOf(received: Received): LlmReply {
        val inputTokens = received.inputTokens
        val outputTokens = received.outputTokens
        if (received.finish == null || inputTokens == null || outputTokens == null) {
            log.warn("DeepSeek's stream ended without its finish or usage")
            throw BlogException(BlogError.LLM_FAILED)
        }
        return LlmReply(
            text = received.text.toString(),
            model = received.model ?: model,
            inputTokens = inputTokens,
            outputTokens = outputTokens,
            finished = received.finish == STOP,
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
        const val DATA = "data:"
        const val DONE = "[DONE]"
        const val STOP = "stop"
        const val OK = 200
        const val UNAUTHORIZED = 401

        // The account's balance ran out.
        const val PAYMENT_REQUIRED = 402
        const val FORBIDDEN = 403
        const val TOO_MANY_REQUESTS = 429
    }
}
