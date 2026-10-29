package blog.book.gateway

import blog.common.exception.BlogError
import blog.common.exception.BlogException
import com.sun.net.httpserver.HttpServer
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import java.net.InetSocketAddress
import java.net.URLDecoder
import java.time.LocalDate

/** Against a local server answering saved YES24 bodies; nothing reaches YES24. */
class Yes24BookSourceGatewayTest {
    private var server: HttpServer? = null
    private var asked: String? = null
    private var key: String? = null
    private var calls = 0

    private fun fixture(name: String): String =
        checkNotNull(javaClass.getResource("/yes24/$name")) { "No fixture $name" }.readText()

    private fun answering(
        status: Int,
        body: String,
        apiKey: String = "yk_test_key",
    ): Yes24BookSourceGateway {
        val started =
            HttpServer.create(InetSocketAddress("127.0.0.1", 0), 0).apply {
                createContext("/") { exchange ->
                    calls++
                    asked =
                        exchange.requestURI.path + "?" + URLDecoder.decode(exchange.requestURI.rawQuery, Charsets.UTF_8)
                    key = exchange.requestHeaders.getFirst("X-Api-Key")
                    val bytes = body.toByteArray()
                    exchange.sendResponseHeaders(status, bytes.size.toLong())
                    exchange.responseBody.use { it.write(bytes) }
                }
                start()
            }
        server = started
        return Yes24BookSourceGateway(baseUrl = "http://127.0.0.1:${started.address.port}/v1", apiKey = apiKey)
    }

    private fun refused(code: String) = """{"success": false, "message": "no", "data": null, "errorCode": "$code"}"""

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
    fun `a book is read by its item number with its contents, markup off`() {
        val gateway = answering(200, fixture("item-detail.json"))

        val book = checkNotNull(gateway.find("74219491"))

        assertThat(asked).isEqualTo("/v1/goods/itemDetail?searchType=ItemId&query=74219491&detail=Y")
        assertThat(key).isEqualTo("yk_test_key")
        assertThat(book.ref).isEqualTo("74219491")
        assertThat(book.url).isEqualTo("https://www.yes24.com/product/goods/74219491")
        assertThat(book.title).isEqualTo("오브젝트")
        assertThat(book.authors).isEqualTo("조영호 저")
        assertThat(book.publisher).isEqualTo("위키북스")
        assertThat(book.isbn13).isEqualTo("9788998139766")
        assertThat(book.publishedOn).isEqualTo(LocalDate.of(2019, 6, 17))
        assertThat(book.coverUrl).isEqualTo("https://image.yes24.com/goods/74219491/L")
        assertThat(book.contents).startsWith("들어가며\n01장: 객체, 설계\n01. 티켓 판매 애플리케이션 구현하기\n   소극장\n")
        assertThat(book.contents).contains("02. 객체지향 & 협력").endsWith("부록 A. 계약에 의한 설계\n찾아보기")
    }

    @Test
    fun `a search asks every category, and keeps only what has an isbn`() {
        val gateway = answering(200, fixture("item-list.json"))

        val books = gateway.search("오브젝트 & 설계")

        assertThat(asked)
            .isEqualTo("/v1/goods/itemList?query=오브젝트 & 설계&category=ALL&sort=RELATION&pageSize=10&detail=Y")
        assertThat(books.map { it.ref }).containsExactly("74219491", "90000002")
        assertThat(books[0].publishedOn).isEqualTo(LocalDate.of(2019, 6, 17))
        val ebook = books[1]
        assertThat(ebook.authors).isNull()
        assertThat(ebook.publishedOn).isNull()
        assertThat(ebook.coverUrl).describedAs("not https").isNull()
        assertThat(ebook.contents).isNull()
    }

    @Test
    fun `no results is an empty list, but a search engine that failed is a failure`() {
        assertThat(answering(404, refused("SEARCH_001")).search("없는 책")).isEmpty()
        stop()
        fails(BlogError.BOOK_SOURCE_FAILED) { answering(404, refused("SEARCH_002")).search("책") }
    }

    @Test
    fun `a reference that is no item number, or names no item, finds nothing`() {
        val gateway = answering(404, refused("GOODS_001"))

        assertThat(gateway.find("1 or 1=1")).isNull()
        assertThat(gateway.find("2147483648")).isNull()
        assertThat(gateway.find("0")).isNull()
        assertThat(calls).isZero()
        assertThat(gateway.find("999")).isNull()
        assertThat(calls).isEqualTo(1)
    }

    @Test
    fun `without a key nothing is asked`() {
        val gateway = answering(200, fixture("item-list.json"), apiKey = "")

        fails(BlogError.BOOK_SOURCE_UNAVAILABLE) { gateway.search("오브젝트") }
        assertThat(calls).isZero()
    }

    @Test
    fun `a refused key, a spent limit and a failure are told apart`() {
        fails(BlogError.BOOK_SOURCE_UNAVAILABLE) { answering(401, refused("AUTH_002")).search("책") }
        stop()
        fails(BlogError.BOOK_SOURCE_BUSY) { answering(429, refused("RATE_001")).search("책") }
        stop()
        fails(BlogError.BOOK_SOURCE_FAILED) { answering(503, refused("UPSTREAM_UNAVAILABLE")).search("책") }
    }

    @Test
    fun `a body that is not the documented answer, and no answer at all, are failures`() {
        fails(BlogError.BOOK_SOURCE_FAILED) { answering(200, "<html>").search("책") }
        stop()
        fails(BlogError.BOOK_SOURCE_FAILED) { answering(200, "{}").search("책") }
        stop()
        fails(BlogError.BOOK_SOURCE_FAILED) { answering(404, "{}").find("101") }
        stop()
        val gateway = answering(200, fixture("item-list.json"))
        stop()
        fails(BlogError.BOOK_SOURCE_FAILED) { gateway.search("책") }
    }
}
