package blog.book.service

import blog.TestcontainersConfiguration
import blog.book.FakeBookSourceGateway
import blog.book.dto.request.BookImportRequest
import blog.book.dto.request.BookSearchRequest
import blog.common.exception.BlogError
import blog.common.exception.BlogException
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.jdbc.core.simple.JdbcClient

// Not @Transactional: what is asked of YES24 must be asked outside any transaction.
@SpringBootTest
@Import(TestcontainersConfiguration::class, FakeBookSourceGateway.Config::class)
class BookSourceServiceTest(
    @Autowired private val bookSourceService: BookSourceService,
    @Autowired private val fakeBookSourceGateway: FakeBookSourceGateway,
    @Autowired private val jdbc: JdbcClient,
) {
    // The context, and its database, is shared with transactional tests that expect no books.
    @BeforeEach
    @AfterEach
    fun clear() {
        jdbc.sql("truncate study_note, post_revision, post, book_section, book").update()
        fakeBookSourceGateway.reset()
    }

    private fun fails(
        error: BlogError,
        call: () -> Unit,
    ) {
        assertThatThrownBy(call).isInstanceOfSatisfying(BlogException::class.java) {
            assertThat(it.error).isEqualTo(error)
        }
    }

    private fun count(table: String) = jdbc.sql("select count(*) from $table").query(Int::class.java).single()

    @Test
    fun `a search lists the editions, which have contents and which are already here`() {
        fakeBookSourceGateway.holds("101")
        fakeBookSourceGateway.holds("102", title = "오브젝트 (eBook)", contents = "들어가며\n감사의 글")
        bookSourceService.import(BookImportRequest(sourceRef = "101"))

        val editions = bookSourceService.search(BookSearchRequest(q = "  오브젝트 "))

        assertThat(fakeBookSourceGateway.asked.last()).isEqualTo("오브젝트")
        assertThat(editions.map { Triple(it.sourceRef, it.hasContents, it.imported) })
            .containsExactly(Triple("101", true, true), Triple("102", false, false))
        assertThat(editions.first().sourceUrl).isEqualTo("https://www.yes24.com/product/goods/101")
    }

    @Test
    fun `an import stores the book with its chapters and sections, outside any transaction while YES24 answers`() {
        fakeBookSourceGateway.holds("101")

        val book = bookSourceService.import(BookImportRequest(sourceRef = "101", topicSlug = "spring"))

        assertThat(book.title).isEqualTo("오브젝트")
        assertThat(book.topic?.slug).isEqualTo("spring")
        assertThat(book.chapters.map { it.number to it.title }).containsExactly("1" to "객체, 설계", "2" to "객체지향")
        assertThat(book.chapters[0].sections.map { it.number }).containsExactly("1.1", "1.2")
        assertThat(
            book.chapters[1]
                .sections
                .single()
                .title,
        ).isEqualTo("영화 예매")
        assertThat(count("book_section")).isEqualTo(5)
        assertThat(fakeBookSourceGateway.inTransaction).containsExactly(false)
    }

    @Test
    fun `the same edition is imported once, and the second time YES24 is not asked`() {
        fakeBookSourceGateway.holds("101")
        bookSourceService.import(BookImportRequest(sourceRef = "101"))

        fails(BlogError.BOOK_ALREADY_IMPORTED) { bookSourceService.import(BookImportRequest(sourceRef = "101")) }
        assertThat(fakeBookSourceGateway.asked).containsExactly("101")
        assertThat(count("book")).isEqualTo(1)
    }

    @Test
    fun `an edition YES24 does not have, or whose contents read as nothing, is not imported`() {
        fakeBookSourceGateway.holds("102", contents = "들어가며\n감사의 글")
        fakeBookSourceGateway.holds("103", contents = null)

        fails(BlogError.BOOK_NOT_IN_SOURCE) { bookSourceService.import(BookImportRequest(sourceRef = "999")) }
        fails(BlogError.BOOK_CONTENTS_UNREADABLE) { bookSourceService.import(BookImportRequest(sourceRef = "102")) }
        fails(BlogError.BOOK_CONTENTS_UNREADABLE) { bookSourceService.import(BookImportRequest(sourceRef = "103")) }
        assertThat(count("book")).isZero()
    }

    @Test
    fun `an unknown topic is refused before YES24 is asked`() {
        fakeBookSourceGateway.holds("101")

        fails(BlogError.POST_TOPIC_NOT_FOUND) {
            bookSourceService.import(BookImportRequest(sourceRef = "101", topicSlug = "cooking"))
        }
        assertThat(fakeBookSourceGateway.asked).isEmpty()
    }

    @Test
    fun `a YES24 failure reaches the caller as it is`() {
        fakeBookSourceGateway.failing = BlogError.BOOK_SOURCE_FAILED

        fails(BlogError.BOOK_SOURCE_FAILED) { bookSourceService.search(BookSearchRequest(q = "오브젝트")) }
    }
}
