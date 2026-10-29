package blog.book

import blog.book.gateway.BookSourceGateway
import blog.book.gateway.SourcedBook
import blog.common.exception.BlogError
import blog.common.exception.BlogException
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Primary
import org.springframework.test.context.DynamicPropertyRegistrar
import org.springframework.transaction.support.TransactionSynchronizationManager
import java.time.LocalDate
import java.util.Collections

/** Holds the editions a test puts in it instead of calling YES24, and remembers what it was asked. */
class FakeBookSourceGateway : BookSourceGateway {
    private val books = Collections.synchronizedList(mutableListOf<SourcedBook>())

    @Volatile
    var failing: BlogError? = null

    val asked: MutableList<String> = Collections.synchronizedList(mutableListOf())

    /** Whether a transaction was open as each call reached the source, in order. */
    val inTransaction: MutableList<Boolean> = Collections.synchronizedList(mutableListOf())

    fun holds(
        ref: String,
        title: String = "오브젝트",
        contents: String? = CONTENTS,
    ): SourcedBook {
        val book =
            SourcedBook(
                ref = ref,
                url = "https://www.yes24.com/product/goods/$ref",
                title = title,
                authors = "조영호 저",
                publisher = "위키북스",
                isbn13 = "9788998139766",
                publishedOn = LocalDate.of(2019, 6, 17),
                coverUrl = "https://image.yes24.com/goods/$ref/L",
                contents = contents,
            )
        books += book
        return book
    }

    override fun search(query: String): List<SourcedBook> {
        reach(query)
        return books.toList()
    }

    override fun find(ref: String): SourcedBook? {
        reach(ref)
        return books.firstOrNull { it.ref == ref }
    }

    private fun reach(asking: String) {
        asked += asking
        inTransaction += TransactionSynchronizationManager.isActualTransactionActive()
        failing?.let { throw BlogException(it) }
    }

    fun reset() {
        books.clear()
        asked.clear()
        inTransaction.clear()
        failing = null
    }

    companion object {
        const val CONTENTS = "1장 객체, 설계\n01. 티켓 판매\n02. 무엇이 문제인가\n2장 객체지향\n01. 영화 예매"
    }

    @TestConfiguration(proxyBeanMethods = false)
    class Config {
        @Bean
        @Primary
        fun fakeBookSourceGateway() = FakeBookSourceGateway()

        // A test's clock stands still, so YES24's pace would hold back every call after the eighth.
        @Bean
        fun bookSourceProperties() =
            DynamicPropertyRegistrar { registry ->
                registry.add("blog.book-source.per-second") { Int.MAX_VALUE }
            }
    }
}
