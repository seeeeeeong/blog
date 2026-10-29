package blog.auth

import blog.Browser
import com.sun.net.httpserver.HttpExchange
import com.sun.net.httpserver.HttpServer
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.context.annotation.Bean
import org.springframework.test.context.DynamicPropertyRegistrar
import java.net.InetSocketAddress
import java.net.URI

/**
 * GitHub's token and user endpoints on a local port, so sign-in runs end to end over real HTTP
 * without reaching GitHub. The browser never visits the authorize page: GitHub would only send it
 * back to the callback with a code and the state, which [signIn] does itself.
 */
class FakeGitHub : AutoCloseable {
    @Volatile
    var login: String = ADMIN

    @Volatile
    var name: String? = "이신성"

    private val server =
        HttpServer.create(InetSocketAddress("127.0.0.1", 0), 0).apply {
            createContext("/login/oauth/access_token") {
                it.answer("""{"access_token":"fake-access","token_type":"bearer","scope":""}""")
            }
            createContext("/user") {
                val name = name?.let { value -> "\"$value\"" } ?: "null"
                it.answer("""{"id":1,"login":"$login","name":$name,"avatar_url":"https://avatars.example/u/1"}""")
            }
            start()
        }

    val url: String get() = "http://127.0.0.1:${server.address.port}"

    /** Starts at the api, then comes back to its callback as GitHub would; answers the callback. */
    fun signIn(
        browser: Browser,
        login: String = ADMIN,
    ): Browser.Response {
        this.login = login
        val start = browser.get("/api/auth/github")
        val authorize = URI(checkNotNull(start.location) { "Sign-in starts with a redirect to GitHub" })
        val state =
            authorize.rawQuery
                .split('&')
                .first { it.startsWith("state=") }
                .substringAfter('=')
        return browser.get("/api/auth/github/callback?code=fake-code&state=$state")
    }

    override fun close() = server.stop(0)

    private fun HttpExchange.answer(body: String) {
        val bytes = body.toByteArray()
        responseHeaders.add("Content-Type", "application/json")
        sendResponseHeaders(200, bytes.size.toLong())
        responseBody.use { it.write(bytes) }
    }

    companion object {
        const val ADMIN = "seeeeeeong"
    }

    @TestConfiguration(proxyBeanMethods = false)
    class Config {
        @Bean
        fun fakeGitHub() = FakeGitHub()

        @Bean
        fun gitHubProperties(fakeGitHub: FakeGitHub) =
            DynamicPropertyRegistrar { registry ->
                registry.add("blog.auth.github.client-id") { "fake-client" }
                registry.add("blog.auth.github.client-secret") { "fake-client-secret" }
                registry.add("blog.auth.github.url") { fakeGitHub.url }
                registry.add("blog.auth.github.api-url") { fakeGitHub.url }
            }
    }
}
