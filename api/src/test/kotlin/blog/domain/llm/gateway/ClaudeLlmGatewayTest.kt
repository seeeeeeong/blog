package blog.domain.llm.gateway

import blog.common.exception.BlogError
import blog.common.exception.BlogException
import com.sun.net.httpserver.HttpExchange
import com.sun.net.httpserver.HttpServer
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import tools.jackson.databind.json.JsonMapper
import java.net.InetSocketAddress
import java.time.Duration
import java.util.concurrent.Executors

/** Against a local server answering in Anthropic's format; nothing reaches Anthropic. */
class ClaudeLlmGatewayTest {
    private val json = JsonMapper()
    private var server: HttpServer? = null
    private var path: String? = null
    private var body: String? = null
    private var key: String? = null
    private var beta: String? = null
    private val chat = LlmChat(model = "claude-opus-5-5", system = "rules", user = "material", maxTokens = 16_000)
    private val pieces = mutableListOf<String>()

    private fun answering(
        apiKey: String = "test-key",
        handler: (HttpExchange) -> Unit,
    ): ClaudeLlmGateway {
        val started =
            HttpServer.create(InetSocketAddress("127.0.0.1", 0), 0).apply {
                createContext("/") { exchange ->
                    path = exchange.requestURI.path
                    body = exchange.requestBody.readAllBytes().decodeToString()
                    key = exchange.requestHeaders.getFirst("x-api-key")
                    beta = exchange.requestHeaders.getFirst("anthropic-beta")
                    runCatching { handler(exchange) }
                    exchange.close()
                }
                executor = Executors.newCachedThreadPool()
                start()
            }
        server = started
        return ClaudeLlmGateway(
            baseUrl = "http://127.0.0.1:${started.address.port}",
            apiKey = apiKey,
            idleTimeout = Duration.ofSeconds(5),
        )
    }

    private fun event(
        name: String,
        data: String,
    ) = "event: $name\ndata: $data\n\n"

    private fun stream(
        stop: String? = "end_turn",
        vararg texts: String,
    ): String =
        buildString {
            append(
                event(
                    "message_start",
                    """{"type":"message_start","message":{"id":"msg_1","type":"message","role":"assistant",
                    "model":"claude-opus-5-5","content":[],"stop_reason":null,"stop_sequence":null,
                    "usage":{"input_tokens":120,"output_tokens":1}}}""".replace("\n", ""),
                ),
            )
            append(event("ping", """{"type":"ping"}"""))
            texts.forEach {
                append(
                    event(
                        "content_block_delta",
                        """{"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"$it"}}""",
                    ),
                )
            }
            if (stop != null) {
                append(
                    event(
                        "message_delta",
                        """{"type":"message_delta","delta":{"stop_reason":"$stop","stop_sequence":null},
                        "usage":{"output_tokens":340}}""".replace("\n", ""),
                    ),
                )
                append(event("message_stop", """{"type":"message_stop"}"""))
            }
        }

    private fun HttpExchange.answer(
        status: Int,
        text: String,
        type: String = "text/event-stream",
    ) {
        val bytes = text.toByteArray()
        responseHeaders.add("Content-Type", type)
        // No wait before the SDK's retries of a 429 or a 5xx.
        responseHeaders.add("retry-after-ms", "0")
        sendResponseHeaders(status, bytes.size.toLong())
        responseBody.use { it.write(bytes) }
    }

    private fun ClaudeLlmGateway.ask(): LlmReply = stream(chat) { pieces += it }

    private fun fails(
        error: BlogError,
        call: () -> Unit,
    ) {
        assertThatThrownBy(call).isInstanceOfSatisfying(BlogException::class.java) {
            assertThat(it.error).isEqualTo(error)
        }
    }

    @AfterEach
    fun stop() {
        server?.stop(0)
    }

    @Test
    fun `a call streams, says its model and limit, opts into the fallback, and carries the key`() {
        answering { it.answer(200, stream(texts = arrayOf("안녕"))) }.ask()

        val sent = json.readTree(body)
        assertThat(path).isEqualTo("/v1/messages")
        assertThat(key).isEqualTo("test-key")
        assertThat(beta).contains("server-side-fallback-2026-07-01")
        assertThat(sent.get("model").asString()).isEqualTo("claude-opus-5-5")
        assertThat(sent.get("max_tokens").asInt()).isEqualTo(16_000)
        assertThat(sent.get("stream").asBoolean()).isTrue()
        assertThat(sent.get("fallbacks").asString()).isEqualTo("default")
        assertThat(sent.get("output_config").get("effort").asString()).isEqualTo("high")
        assertThat(sent.get("system").asString()).isEqualTo("rules")
        assertThat(
            sent
                .get("messages")
                .get(0)
                .get("content")
                .asString(),
        ).isEqualTo("material")
        assertThat(sent.has("thinking")).isFalse()
    }

    @Test
    fun `the answer comes piece by piece, then whole with its tokens`() {
        val reply = answering { it.answer(200, stream(texts = arrayOf("세 번", " 악수"))) }.ask()

        assertThat(pieces).containsExactly("세 번", " 악수")
        assertThat(reply.text).isEqualTo("세 번 악수")
        assertThat(reply.model).isEqualTo("claude-opus-5-5")
        assertThat(reply.inputTokens).isEqualTo(120)
        assertThat(reply.outputTokens).isEqualTo(340)
        assertThat(reply.finished).isTrue()
    }

    @Test
    fun `an answer cut off at its limit or refused is not finished`() {
        assertThat(answering { it.answer(200, stream("max_tokens", "반쯤")) }.ask().finished).isFalse()
        stop()
        assertThat(answering { it.answer(200, stream("refusal")) }.ask().finished).isFalse()
    }

    @Test
    fun `a stream that ends without its stop reason failed`() {
        fails(BlogError.LLM_FAILED) { answering { it.answer(200, stream(null, "반쯤")) }.ask() }
    }

    @Test
    fun `a refused key and an empty balance mean Claude is unavailable`() {
        for (status in listOf(401, 402, 403)) {
            fails(BlogError.LLM_UNAVAILABLE) {
                answering { it.answer(status, """{"type":"error"}""", "application/json") }.ask()
            }
            stop()
        }
    }

    @Test
    fun `too many requests or an overload means busy, and a server error failed`() {
        for (status in listOf(429, 529)) {
            fails(BlogError.LLM_BUSY) {
                answering { it.answer(status, """{"type":"error"}""", "application/json") }.ask()
            }
            stop()
        }
        fails(BlogError.LLM_FAILED) {
            answering { it.answer(500, """{"type":"error"}""", "application/json") }.ask()
        }
    }

    @Test
    fun `without a key nothing is asked`() {
        val gateway = answering(apiKey = " ") { it.answer(200, stream(texts = arrayOf("안녕"))) }

        assertThat(gateway.configured).isFalse()
        fails(BlogError.LLM_UNAVAILABLE) { gateway.ask() }
        assertThat(path).isNull()
    }

    @Test
    fun `it serves Claude's models and no others`() {
        val gateway = ClaudeLlmGateway("http://127.0.0.1:1", "test-key", Duration.ofSeconds(1))

        assertThat(gateway.serves("claude-sonnet-5-5")).isTrue()
        assertThat(gateway.serves("deepseek-flash")).isFalse()
    }
}
