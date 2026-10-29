package blog.llm.gateway

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
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

/** Against a local server answering in DeepSeek's format; nothing reaches DeepSeek. */
class DeepSeekLlmGatewayTest {
    private val json = JsonMapper()
    private var server: HttpServer? = null
    private var path: String? = null
    private var body: String? = null
    private var authorization: String? = null
    private var calls = 0
    private val chat = LlmChat(system = "rules", user = "material", maxTokens = 8_192)
    private val pieces = mutableListOf<String>()

    private fun fixture(name: String): String =
        checkNotNull(javaClass.getResource("/deepseek/$name")) { "No fixture $name" }.readText()

    private fun answering(
        apiKey: String = "ds-test-key",
        idleTimeout: Duration = Duration.ofSeconds(5),
        handler: (HttpExchange) -> Unit,
    ): DeepSeekLlmGateway {
        val started =
            HttpServer.create(InetSocketAddress("127.0.0.1", 0), 0).apply {
                createContext("/") { exchange ->
                    calls++
                    path = exchange.requestURI.path
                    body = exchange.requestBody.readAllBytes().decodeToString()
                    authorization = exchange.requestHeaders.getFirst("Authorization")
                    runCatching { handler(exchange) }
                    exchange.close()
                }
                executor = Executors.newCachedThreadPool()
                start()
            }
        server = started
        return DeepSeekLlmGateway(
            baseUrl = "http://127.0.0.1:${started.address.port}",
            apiKey = apiKey,
            model = "deepseek-flash",
            idleTimeout = idleTimeout,
        )
    }

    private fun HttpExchange.answer(
        status: Int,
        text: String,
        type: String = "application/json",
    ) {
        val bytes = text.toByteArray()
        responseHeaders.add("Content-Type", type)
        sendResponseHeaders(status, bytes.size.toLong())
        responseBody.use { it.write(bytes) }
    }

    private fun HttpExchange.stream(text: String) = answer(200, text, "text/event-stream")

    private fun DeepSeekLlmGateway.ask(): LlmReply = stream(chat) { pieces += it }

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
    fun `a call streams, says its model and limit, asks for usage, turns thinking off, and carries the key`() {
        answering { it.stream(fixture("completion.sse")) }.ask()

        val sent = json.readTree(body)
        assertThat(path).isEqualTo("/chat/completions")
        assertThat(authorization).isEqualTo("Bearer ds-test-key")
        assertThat(sent.get("model").asString()).isEqualTo("deepseek-flash")
        assertThat(sent.get("max_tokens").asInt()).isEqualTo(8_192)
        assertThat(sent.get("thinking").get("type").asString()).isEqualTo("disabled")
        assertThat(sent.get("stream").asBoolean()).isTrue()
        assertThat(sent.get("stream_options").get("include_usage").asBoolean()).isTrue()
        val messages = sent.get("messages").toList().map { it.get("role").asString() to it.get("content").asString() }
        assertThat(messages).containsExactly("system" to "rules", "user" to "material")
    }

    @Test
    fun `each piece is handed on as it comes, and the answer comes whole with the tokens it took`() {
        val reply = answering { it.stream(fixture("completion.sse")) }.ask()

        assertThat(pieces).containsExactly(
            "## 책임 주도 설계\n\n",
            "객체는 **책임**을 먼저 정합니다.\n\n",
            "<Callout label=\"핵심\">\n메시지가 객체를 고릅니다.\n</Callout>\n",
        )
        assertThat(reply.text).isEqualTo(pieces.joinToString(""))
        assertThat(reply.model).isEqualTo("deepseek-flash")
        assertThat(reply.inputTokens).isEqualTo(412)
        assertThat(reply.outputTokens).isEqualTo(1830)
        assertThat(reply.finished).isTrue()
    }

    @Test
    fun `an answer cut off at the limit is not finished, but its tokens are known from the last piece`() {
        val reply = answering { it.stream(fixture("cut-off.sse")) }.ask()

        assertThat(reply.finished).isFalse()
        assertThat(reply.text).isEqualTo("## 책임 주도 설계\n\n객체는")
        assertThat(reply.outputTokens).isEqualTo(8_192)
    }

    @Test
    fun `without a key nothing is asked`() {
        val gateway = answering(apiKey = " ") { it.stream(fixture("completion.sse")) }

        assertThat(gateway.configured).isFalse()
        fails(BlogError.LLM_UNAVAILABLE) { gateway.ask() }
        assertThat(calls).isZero()
    }

    @Test
    fun `a refused key or an empty balance is unavailable, a rate limit busy, anything else a failure`() {
        val errors =
            listOf(401, 402, 429, 400, 500, 503).associateWith { status ->
                stop()
                val gateway = answering { it.answer(status, fixture("error.json")) }
                (runCatching { gateway.ask() }.exceptionOrNull() as BlogException).error
            }

        assertThat(errors).containsExactlyEntriesOf(
            mapOf(
                401 to BlogError.LLM_UNAVAILABLE,
                402 to BlogError.LLM_UNAVAILABLE,
                429 to BlogError.LLM_BUSY,
                400 to BlogError.LLM_FAILED,
                500 to BlogError.LLM_FAILED,
                503 to BlogError.LLM_FAILED,
            ),
        )
    }

    @Test
    fun `a stream that is not DeepSeek's, or ends without its usage, is a failure`() {
        fails(BlogError.LLM_FAILED) { answering { it.stream("data: <html>proxy</html>\n\n") }.ask() }
        stop()
        val noUsage =
            """
            data: {"model":"deepseek-flash","choices":[{"index":0,"delta":{"content":"x"},"finish_reason":"stop"}]}

            data: [DONE]
            """.trimIndent()
        fails(BlogError.LLM_FAILED) { answering { it.stream(noUsage) }.ask() }
    }

    @Test
    fun `a stream quiet longer than the idle timeout is a failure`() {
        val released = CountDownLatch(1)
        val gateway =
            answering(idleTimeout = Duration.ofMillis(200)) {
                released.await(5, TimeUnit.SECONDS)
                it.stream(fixture("completion.sse"))
            }
        try {
            fails(BlogError.LLM_FAILED) { gateway.ask() }
        } finally {
            released.countDown()
        }
    }
}
