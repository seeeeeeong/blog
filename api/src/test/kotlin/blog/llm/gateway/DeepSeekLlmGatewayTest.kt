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

    private fun fixture(name: String): String =
        checkNotNull(javaClass.getResource("/deepseek/$name")) { "No fixture $name" }.readText()

    private fun answering(
        apiKey: String = "ds-test-key",
        readTimeout: Duration = Duration.ofSeconds(5),
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
            readTimeout = readTimeout,
        )
    }

    private fun HttpExchange.answer(
        status: Int,
        text: String,
    ) {
        val bytes = text.toByteArray()
        responseHeaders.add("Content-Type", "application/json")
        sendResponseHeaders(status, bytes.size.toLong())
        responseBody.use { it.write(bytes) }
    }

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
    fun `a call says its model and limit, turns thinking off, and carries the key`() {
        answering { it.answer(200, fixture("completion.json")) }.complete(chat)

        val sent = json.readTree(body)
        assertThat(path).isEqualTo("/chat/completions")
        assertThat(authorization).isEqualTo("Bearer ds-test-key")
        assertThat(sent.get("model").asString()).isEqualTo("deepseek-flash")
        assertThat(sent.get("max_tokens").asInt()).isEqualTo(8_192)
        assertThat(sent.get("thinking").get("type").asString()).isEqualTo("disabled")
        assertThat(sent.get("stream").asBoolean()).isFalse()
        val messages = sent.get("messages").toList().map { it.get("role").asString() to it.get("content").asString() }
        assertThat(messages).containsExactly("system" to "rules", "user" to "material")
    }

    @Test
    fun `an answer comes with the tokens it took`() {
        val reply = answering { it.answer(200, fixture("completion.json")) }.complete(chat)

        assertThat(reply.text).startsWith("## 책임 주도 설계\n\n객체는 **책임**을").contains("<Callout label=\"핵심\">")
        assertThat(reply.model).isEqualTo("deepseek-flash")
        assertThat(reply.inputTokens).isEqualTo(412)
        assertThat(reply.outputTokens).isEqualTo(1830)
        assertThat(reply.finished).isTrue()
    }

    @Test
    fun `an answer cut off at the limit is not finished, but its tokens are known`() {
        val reply = answering { it.answer(200, fixture("cut-off.json")) }.complete(chat)

        assertThat(reply.finished).isFalse()
        assertThat(reply.outputTokens).isEqualTo(8_192)
    }

    @Test
    fun `without a key nothing is asked`() {
        val gateway = answering(apiKey = " ") { it.answer(200, fixture("completion.json")) }

        fails(BlogError.LLM_UNAVAILABLE) { gateway.complete(chat) }
        assertThat(calls).isZero()
    }

    @Test
    fun `a refused key or an empty balance is unavailable, a rate limit busy, anything else a failure`() {
        val errors =
            listOf(401, 402, 429, 400, 500, 503).associateWith { status ->
                stop()
                val gateway = answering { it.answer(status, fixture("error.json")) }
                (runCatching { gateway.complete(chat) }.exceptionOrNull() as BlogException).error
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
    fun `a 200 that is not an answer, or has no usage, is a failure`() {
        fails(BlogError.LLM_FAILED) { answering { it.answer(200, "<html>proxy</html>") }.complete(chat) }
        stop()
        val noUsage = """{"model":"deepseek-flash","choices":[{"message":{"content":"x"},"finish_reason":"stop"}]}"""
        fails(BlogError.LLM_FAILED) { answering { it.answer(200, noUsage) }.complete(chat) }
    }

    @Test
    fun `an answer slower than the read timeout is a failure`() {
        val released = CountDownLatch(1)
        val gateway =
            answering(readTimeout = Duration.ofMillis(200)) {
                released.await(5, TimeUnit.SECONDS)
                it.answer(200, fixture("completion.json"))
            }
        try {
            fails(BlogError.LLM_FAILED) { gateway.complete(chat) }
        } finally {
            released.countDown()
        }
    }
}
