package blog

import blog.common.web.EventStream
import org.springframework.mock.web.MockHttpServletResponse
import tools.jackson.databind.JsonNode
import tools.jackson.databind.json.JsonMapper
import tools.jackson.module.kotlin.jacksonMapperBuilder
import java.time.Duration
import kotlin.reflect.KClass

/** Server-sent events as a reader receives them, read from a response body. */
class ServerSentEvents(
    val events: List<Event>,
) {
    data class Event(
        val name: String,
        val data: JsonNode,
    )

    val names: List<String> get() = events.map { it.name }

    /** Every `text` piece, joined. */
    val text: String get() =
        events
            .filter {
                it.name == EventStream.TEXT
            }.joinToString("") { it.data.get("text").asString() }

    fun single(name: String): JsonNode = events.single { it.name == name }.data

    /** The `done` event's data, read as the response it carries. */
    fun <T : Any> done(type: KClass<T>): T = json.treeToValue(single(EventStream.DONE), type.java)

    /** An [EventStream] on a response of its own, and what it was sent. */
    class Recorder(
        pingEvery: Duration = Duration.ofMinutes(1),
    ) {
        val response = MockHttpServletResponse()
        val stream = EventStream(response, json, pingEvery)

        fun events(): ServerSentEvents = parse(response.contentAsString)
    }

    companion object {
        private val json: JsonMapper = jacksonMapperBuilder().build()

        fun parse(body: String): ServerSentEvents =
            ServerSentEvents(
                body
                    .split("\n\n")
                    .mapNotNull { frame ->
                        val lines = frame.lines()
                        val name = lines.firstOrNull { it.startsWith("event: ") }?.removePrefix("event: ")
                        val data = lines.firstOrNull { it.startsWith("data: ") }?.removePrefix("data: ")
                        if (name == null || data == null) null else Event(name, json.readTree(data))
                    },
            )
    }
}
