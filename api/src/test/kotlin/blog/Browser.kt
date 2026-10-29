package blog

import tools.jackson.databind.JsonNode
import tools.jackson.databind.json.JsonMapper
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse

/**
 * One browser against the running app over real HTTP: it keeps the cookies it is given and, on a
 * write, sends the CSRF cookie back as a header, as the admin's page does. It keeps a Secure cookie
 * over plain http too, since the app here sits behind no TLS proxy. It follows no redirect.
 */
class Browser(
    private val port: Int,
) {
    private val json = JsonMapper()
    private val client = HttpClient.newHttpClient()
    private val cookies = linkedMapOf<String, String>()

    data class Response(
        val status: Int,
        val body: JsonNode?,
        val setCookies: List<String>,
        val location: String?,
    ) {
        val code: String? get() = body?.get("code")?.asString()

        fun setCookie(name: String): String? = setCookies.firstOrNull { it.startsWith("$name=") }
    }

    fun get(path: String) = send("GET", path)

    fun post(
        path: String,
        body: Any? = null,
    ) = send("POST", path, body)

    fun put(
        path: String,
        body: Any,
    ) = send("PUT", path, body)

    /** What the admin's page does before its first write. */
    fun fetchCsrf() = get("/api/auth/csrf")

    fun cookie(name: String): String? = cookies[name]

    fun setCookie(
        name: String,
        value: String,
    ) {
        cookies[name] = value
    }

    fun send(
        method: String,
        path: String,
        body: Any? = null,
        csrf: Boolean = true,
    ): Response {
        val request =
            HttpRequest
                .newBuilder(URI.create("http://127.0.0.1:$port$path"))
                .method(
                    method,
                    body?.let { HttpRequest.BodyPublishers.ofString(json.writeValueAsString(it)) }
                        ?: HttpRequest.BodyPublishers.noBody(),
                ).header("Content-Type", "application/json")
                .apply { if (cookies.isNotEmpty()) header("Cookie", cookies.entries.joinToString("; ")) }
                .apply { if (csrf && method != "GET") cookies["XSRF-TOKEN"]?.let { header("X-XSRF-TOKEN", it) } }
                .build()
        val response = client.send(request, HttpResponse.BodyHandlers.ofString())
        val setCookies = response.headers().allValues("set-cookie")
        setCookies.forEach(::keep)
        val isJson =
            response
                .headers()
                .firstValue("content-type")
                .orElse("")
                .contains("json")
        return Response(
            status = response.statusCode(),
            body = response.body().takeIf { isJson && it.isNotBlank() }?.let { json.readTree(it) },
            setCookies = setCookies,
            location = response.headers().firstValue("location").orElse(null),
        )
    }

    private fun keep(setCookie: String) {
        val pair = setCookie.substringBefore(';')
        val name = pair.substringBefore('=')
        val value = pair.substringAfter('=')
        if (value.isEmpty() || setCookie.contains("Max-Age=0")) cookies.remove(name) else cookies[name] = value
    }
}
