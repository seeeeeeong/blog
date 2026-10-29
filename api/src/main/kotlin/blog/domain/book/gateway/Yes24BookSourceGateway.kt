package blog.domain.book.gateway

import blog.common.exception.BlogError
import blog.common.exception.BlogException
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.client.JdkClientHttpRequestFactory
import org.springframework.stereotype.Component
import org.springframework.web.client.ResourceAccessException
import org.springframework.web.client.RestClient
import tools.jackson.core.JacksonException
import tools.jackson.databind.JsonNode
import tools.jackson.databind.json.JsonMapper
import java.net.http.HttpClient
import java.time.Duration
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.format.DateTimeParseException

/**
 * YES24's Open API (developers.yes24.com) on the owner's key. A search and a book each take one
 * call, since `detail=Y` carries the contents with the rest. Its terms ask that YES24 be named and
 * the book's page linked wherever these details show. Never logs the key.
 */
@Component
class Yes24BookSourceGateway(
    @Value("\${blog.yes24.base-url}") baseUrl: String,
    @Value("\${blog.yes24.api-key}") private val apiKey: String,
) : BookSourceGateway {
    private val log = LoggerFactory.getLogger(javaClass)
    private val json = JsonMapper()

    private val restClient =
        RestClient
            .builder()
            .baseUrl(baseUrl)
            .requestFactory(
                JdkClientHttpRequestFactory(HttpClient.newBuilder().connectTimeout(CONNECT_TIMEOUT).build())
                    .apply { setReadTimeout(READ_TIMEOUT) },
            ).build()

    // Every category, since a translated book is BOOK and its original FOREIGN.
    override fun search(query: String): List<SourcedBook> =
        items("/goods/itemList?query={query}&category=ALL&sort=RELATION&pageSize={size}&detail=Y", query, PAGE_SIZE)
            .mapNotNull(::bookOf)

    override fun find(ref: String): SourcedBook? {
        val id = ref.takeIf(ITEM_ID::matches)?.toIntOrNull()?.takeIf { it > 0 } ?: return null
        return items("/goods/itemDetail?searchType=ItemId&query={id}&detail=Y", id).firstNotNullOfOrNull(::bookOf)
    }

    private fun items(
        uri: String,
        vararg values: Any,
    ): List<JsonNode> {
        if (apiKey.isBlank()) throw BlogException(BlogError.BOOK_SOURCE_UNAVAILABLE)
        try {
            return restClient
                .get()
                .uri(uri, *values)
                .header(KEY_HEADER, apiKey)
                .exchange { _, response -> itemsOf(response.statusCode.value(), response.body.readAllBytes()) }
        } catch (exception: ResourceAccessException) {
            throw BlogException(BlogError.BOOK_SOURCE_FAILED, exception)
        }
    }

    private fun itemsOf(
        status: Int,
        body: ByteArray,
    ): List<JsonNode> {
        val answer =
            try {
                json.readTree(body)
            } catch (exception: JacksonException) {
                throw BlogException(BlogError.BOOK_SOURCE_FAILED, exception)
            }
        val code =
            answer
                .path("errorCode")
                .takeIf { it.isString }
                ?.asString()
                .orEmpty()
        val found = answer.path("data").path("items")
        return when {
            // A 200 that is not the answer the API documents, as a proxy's own page would be, is no "no results".
            status == OK && answer.path("success").asBoolean(false) && found.isArray -> found.toList()

            // "No results" and "no such item" come as 404 with a code; a 404 without one is a wrong address.
            status == NOT_FOUND && code in NOTHING_FOUND -> emptyList()

            else -> throw BlogException(errorOf(status, code))
        }
    }

    private fun errorOf(
        status: Int,
        code: String,
    ): BlogError {
        log.warn("YES24 answered {} {}", status, code)
        return when (status) {
            UNAUTHORIZED, FORBIDDEN -> BlogError.BOOK_SOURCE_UNAVAILABLE
            TOO_MANY_REQUESTS -> BlogError.BOOK_SOURCE_BUSY
            else -> BlogError.BOOK_SOURCE_FAILED
        }
    }

    // Null for an item with no number, title or ISBN: without an ISBN it is a set, a record or goods,
    // which a search across every category also finds.
    private fun bookOf(item: JsonNode): SourcedBook? {
        val id = item.path("itemId").takeIf { it.isIntegralNumber && it.canConvertToLong() }?.asLong() ?: return null
        val title = item.text("title")?.let { clip(it, MAX_TITLE) } ?: return null
        val isbn13 = item.text("isbn13")?.replace(SEPARATORS, "")?.takeIf(ISBN13::matches) ?: return null
        return SourcedBook(
            ref = id.toString(),
            url = "$PRODUCT_PAGE$id",
            title = title,
            // One line with roles, as "A,B 공저/C 역".
            authors = item.text("author")?.let { clip(it, MAX_AUTHORS) },
            publisher = item.text("publisher")?.let { clip(it, MAX_NAME) },
            isbn13 = isbn13,
            publishedOn = item.text("publishDate")?.let(::dateOf),
            // Shown on a page served over HTTPS, so an address of another scheme is no cover.
            coverUrl = item.text("cover")?.takeIf { it.startsWith("https://") && it.length <= MAX_URL },
            contents = item.path("contentDetail").text("tableOfContents")?.let(Yes24Contents::clean),
        )
    }

    private fun JsonNode.text(name: String): String? =
        path(name)
            .takeIf { it.isString }
            ?.asString()
            ?.takeIf { it.isNotBlank() }

    // Null when nothing is left. Counted by code point, as PostgreSQL's char_length does.
    private fun clip(
        text: String,
        max: Int,
    ): String? {
        val clean = text.filterNot { it.isISOControl() }.trim()
        val end = clean.offsetByCodePoints(0, minOf(max, clean.codePointCount(0, clean.length)))
        return clean.substring(0, end).trim().takeIf { it.isNotEmpty() }
    }

    // "20200910" is what the API sends and "2013-12-24" what its documentation shows.
    private fun dateOf(text: String): LocalDate? =
        DATE_FORMATS.firstNotNullOfOrNull {
            try {
                LocalDate.parse(text, it)
            } catch (_: DateTimeParseException) {
                null
            }
        }

    private companion object {
        // A TCP and TLS handshake with a healthy API takes well under a second; three allows a slow link.
        val CONNECT_TIMEOUT: Duration = Duration.ofSeconds(3)

        // A search carries ten books' contents; eight is as long as the admin should wait before "try again".
        val READ_TIMEOUT: Duration = Duration.ofSeconds(8)
        const val KEY_HEADER = "X-Api-Key"

        // Editions to choose from, each with its contents: enough to find a book by its title.
        const val PAGE_SIZE = 10
        const val PRODUCT_PAGE = "https://www.yes24.com/product/goods/"
        val DATE_FORMATS = listOf(DateTimeFormatter.BASIC_ISO_DATE, DateTimeFormatter.ISO_LOCAL_DATE)

        // YES24 answers a number past a 32-bit int as a bad query (400 PARAM_004), not as no such item.
        val ITEM_ID = Regex("[0-9]{1,10}")
        val ISBN13 = Regex("97[89][0-9]{10}")
        val SEPARATORS = Regex("[\\s\\p{Z}\\p{Pd}]")

        // No results, no such item, no such ISBN. SEARCH_002 is not among them: it is the search engine
        // failing, which the documentation says to wait out.
        val NOTHING_FOUND = setOf("SEARCH_001", "GOODS_001", "GOODS_002")

        // As book's checks (V5).
        const val MAX_TITLE = 300
        const val MAX_AUTHORS = 300
        const val MAX_NAME = 100
        const val MAX_URL = 500
        const val OK = 200
        const val UNAUTHORIZED = 401
        const val FORBIDDEN = 403
        const val NOT_FOUND = 404
        const val TOO_MANY_REQUESTS = 429
    }
}
