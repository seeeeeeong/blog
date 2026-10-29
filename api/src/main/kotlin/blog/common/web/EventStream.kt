package blog.common.web

import blog.common.exception.BlogError
import blog.common.exception.BlogException
import blog.common.exception.ErrorCode
import blog.common.exception.ErrorResponse
import blog.common.util.traceOf
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import tools.jackson.databind.json.JsonMapper
import java.io.IOException
import java.time.Duration
import java.util.UUID
import java.util.concurrent.Executors
import java.util.concurrent.ScheduledExecutorService
import java.util.concurrent.TimeUnit
import java.util.concurrent.locks.ReentrantLock
import kotlin.concurrent.withLock

/**
 * A model's answer as server-sent events: `text` pieces as they come, then one `done` with the
 * result, or one `error` with `{code, message}`. A failure before [stream] opens it answers as JSON
 * with its status instead. A reader who leaves is let go: writes stop, and the work runs on to its
 * end, so what the model billed is still recorded.
 */
class EventStream(
    private val response: HttpServletResponse,
    private val jsonMapper: JsonMapper,
    private val pingEvery: Duration = PING_EVERY,
) {
    private val log = LoggerFactory.getLogger(javaClass)
    private val lock = ReentrantLock()

    @Volatile
    private var gone = false

    /** Opens the stream and runs [block], which sends the events; a failure inside it ends as an `error`. */
    @Suppress("TooGenericExceptionCaught")
    fun stream(block: () -> Unit) {
        open()
        val pings =
            PINGS.scheduleAtFixedRate(
                { Thread.ofVirtual().name("event-stream-ping").start(::ping) },
                pingEvery.toMillis(),
                pingEvery.toMillis(),
                TimeUnit.MILLISECONDS,
            )
        try {
            block()
        } catch (exception: BlogException) {
            exception.cause?.let { log.warn("{} caused by{}", exception.error.code, traceOf(it)) }
            fail(exception.error)
        } catch (exception: Exception) {
            val incident = UUID.randomUUID().toString().take(INCIDENT_LENGTH)
            log.error("Unhandled exception in a stream [{}]{}", incident, traceOf(exception))
            send(ERROR, ErrorResponse(BlogError.INTERNAL.code, "${BlogError.INTERNAL.message} (오류 번호 $incident)"))
        } finally {
            pings.cancel(false)
        }
    }

    fun text(piece: String) {
        if (piece.isNotEmpty()) send(TEXT, mapOf("text" to piece))
    }

    fun done(result: Any) = send(DONE, result)

    fun send(
        event: String,
        data: Any,
    ) = write("event: $event\ndata: ${jsonMapper.writeValueAsString(data)}\n\n", wait = true)

    private fun fail(error: ErrorCode) = send(ERROR, ErrorResponse(error.code, error.message))

    private fun open() {
        response.status = HttpServletResponse.SC_OK
        response.contentType = "text/event-stream"
        response.characterEncoding = "UTF-8"
        // A proxy that buffers or compresses would hold the answer back until it ends.
        response.setHeader("Cache-Control", "no-cache, no-transform")
        response.setHeader("X-Accel-Buffering", "no")
        write(": open\n\n", wait = true)
    }

    // Skips its turn while an event is being written: that write shows the reader the stream is alive.
    private fun ping() = write(": ping\n\n", wait = false)

    private fun write(
        frame: String,
        wait: Boolean,
    ) {
        if (gone) return
        if (wait) {
            lock.lock()
        } else if (!lock.tryLock()) {
            return
        }
        try {
            val out = response.outputStream
            out.write(frame.toByteArray(Charsets.UTF_8))
            out.flush()
        } catch (_: IOException) {
            gone = true
        } finally {
            lock.unlock()
        }
    }

    companion object {
        const val TEXT = "text"
        const val DONE = "done"
        const val ERROR = "error"

        // Well under Cloudflare's 100 seconds and Next's proxy timeout of 30 without a byte, while the
        // model queues the request or thinks before its first piece.
        private val PING_EVERY: Duration = Duration.ofSeconds(15)
        private const val INCIDENT_LENGTH = 8

        private val PINGS: ScheduledExecutorService =
            Executors.newSingleThreadScheduledExecutor { Thread(it, "event-stream-pings").apply { isDaemon = true } }
    }
}
