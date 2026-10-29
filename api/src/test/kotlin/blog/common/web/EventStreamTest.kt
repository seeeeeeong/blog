package blog.common.web

import blog.ServerSentEvents
import blog.common.exception.BlogError
import blog.common.exception.BlogException
import jakarta.servlet.ServletOutputStream
import jakarta.servlet.WriteListener
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.mock.web.MockHttpServletResponse
import tools.jackson.databind.json.JsonMapper
import java.io.IOException
import java.time.Duration

class EventStreamTest {
    @Test
    fun `an answer is text events, then one done, each its data as one line of JSON`() {
        val recorder = ServerSentEvents.Recorder()

        recorder.stream.stream {
            recorder.stream.text("첫 줄\n")
            recorder.stream.text("")
            recorder.stream.text("\"둘째\"")
            recorder.stream.done(mapOf("bodyMdx" to "첫 줄\n\"둘째\""))
        }

        val response = recorder.response
        assertThat(response.status).isEqualTo(200)
        assertThat(response.contentType).isEqualTo("text/event-stream;charset=UTF-8")
        assertThat(response.getHeader("Cache-Control")).isEqualTo("no-cache, no-transform")
        assertThat(response.getHeader("X-Accel-Buffering")).isEqualTo("no")
        assertThat(response.contentAsString).isEqualTo(
            ": open\n\n" +
                "event: text\ndata: {\"text\":\"첫 줄\\n\"}\n\n" +
                "event: text\ndata: {\"text\":\"\\\"둘째\\\"\"}\n\n" +
                "event: done\ndata: {\"bodyMdx\":\"첫 줄\\n\\\"둘째\\\"\"}\n\n",
        )
    }

    @Test
    fun `a failure inside the stream ends it as an error event with the error's code and message`() {
        val recorder = ServerSentEvents.Recorder()

        recorder.stream.stream {
            recorder.stream.text("앞")
            throw BlogException(BlogError.LLM_FAILED)
        }

        val events = recorder.events()
        assertThat(events.names).containsExactly("text", "error")
        assertThat(events.single("error").get("code").asString()).isEqualTo("llm.failed")
        assertThat(events.single("error").get("message").asString()).isEqualTo(BlogError.LLM_FAILED.message)
    }

    @Test
    fun `an unexpected failure says nothing of itself, only an incident to find in the log`() {
        val recorder = ServerSentEvents.Recorder()

        recorder.stream.stream { error("secret detail") }

        val error = recorder.events().single("error")
        assertThat(error.get("code").asString()).isEqualTo("common.internal")
        assertThat(error.get("message").asString())
            .matches("잠시 후 다시 시도해 주세요 \\(오류 번호 [0-9a-f-]{8}\\)")
            .doesNotContain("secret")
    }

    @Test
    fun `a reader who left is let go, and the work runs on to its end`() {
        val response = GoneResponse()
        val stream = EventStream(response, JsonMapper())
        var ended = false

        stream.stream {
            stream.text("하나")
            stream.text("둘")
            stream.done(mapOf("ok" to true))
            ended = true
        }

        assertThat(ended).isTrue()
        assertThat(response.writes).isEqualTo(1)
    }

    @Test
    fun `a quiet stream is pinged so no proxy takes it for dead`() {
        val recorder = ServerSentEvents.Recorder(pingEvery = Duration.ofMillis(10))
        val deadline = System.nanoTime() + Duration.ofSeconds(5).toNanos()
        var pinged = false

        recorder.stream.stream {
            while (!pinged && System.nanoTime() < deadline) {
                pinged = recorder.response.contentAsString.contains(": ping\n\n")
                Thread.onSpinWait()
            }
        }

        assertThat(pinged).isTrue()
    }

    /** A response whose reader has gone: the first write fails, as a closed socket does. */
    private class GoneResponse : MockHttpServletResponse() {
        var writes = 0

        private val out =
            object : ServletOutputStream() {
                override fun isReady() = true

                override fun setWriteListener(listener: WriteListener) = Unit

                override fun write(b: Int): Unit = throw IOException("Broken pipe")

                override fun write(
                    b: ByteArray,
                    off: Int,
                    len: Int,
                ) {
                    writes++
                    throw IOException("Broken pipe")
                }
            }

        override fun getOutputStream(): ServletOutputStream = out
    }
}
