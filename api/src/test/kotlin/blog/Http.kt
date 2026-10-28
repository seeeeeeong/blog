package blog

import tools.jackson.databind.JsonNode
import tools.jackson.databind.json.JsonMapper
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse

/** A reader's requests to the running app over real HTTP, their bodies read as JSON. */
class Http(
    private val port: Int,
) {
    private val json = JsonMapper()
    private val client = HttpClient.newHttpClient()

    data class Response(
        val status: Int,
        val body: JsonNode,
    ) {
        val code: String? get() = body.get("code")?.asString()
    }

    fun get(path: String) = send("GET", path)

    fun send(
        method: String,
        path: String,
    ): Response {
        val request =
            HttpRequest
                .newBuilder(URI.create("http://127.0.0.1:$port$path"))
                .method(method, HttpRequest.BodyPublishers.ofString("{}"))
                .header("Content-Type", "application/json")
                .build()
        val response = client.send(request, HttpResponse.BodyHandlers.ofString())
        return Response(response.statusCode(), json.readTree(response.body().ifEmpty { "{}" }))
    }
}
