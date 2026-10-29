package blog.domain.book.service

import blog.TestcontainersConfiguration
import blog.common.exception.BlogError
import blog.common.exception.BlogException
import blog.domain.book.FakeBookSourceGateway
import blog.domain.book.dto.request.BookImportRequest
import blog.domain.book.dto.response.AdminBookResponse
import blog.domain.post.dto.request.PostSaveRequest
import blog.domain.post.service.AdminPostService
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@SpringBootTest
@Import(TestcontainersConfiguration::class, FakeBookSourceGateway.Config::class)
@Transactional
class BookServiceTest(
    @Autowired private val bookService: BookService,
    @Autowired private val bookSourceService: BookSourceService,
    @Autowired private val adminBookService: AdminBookService,
    @Autowired private val adminPostService: AdminPostService,
    @Autowired private val fakeBookSourceGateway: FakeBookSourceGateway,
) {
    @BeforeEach
    fun reset() {
        fakeBookSourceGateway.reset()
    }

    private fun imported(): AdminBookResponse {
        fakeBookSourceGateway.holds("101")
        return bookSourceService.import(BookImportRequest(sourceRef = "101", topicSlug = "spring"))
    }

    private fun AdminBookResponse.section(number: String) =
        chapters.flatMap { listOf(it) + it.sections }.single { it.number == number }.id

    private fun publish(
        section: UUID,
        slug: String,
    ) {
        val draft = adminBookService.writePost(section).post
        adminPostService.publish(
            draft.id,
            PostSaveRequest(
                version = draft.version,
                title = draft.title,
                slug = slug,
                topicSlug = draft.topic.slug,
                position = draft.position,
                summary = "요약",
                bodyMdx = "# 본문",
            ),
        )
    }

    @Test
    fun `progress counts the sections with a published post, of every section and chapter without one`() {
        val book = imported()
        publish(book.section("1.1"), slug = "ticket")
        adminBookService.writePost(book.section("1.2"))

        val listed = bookService.list().single()

        assertThat(listed.title).isEqualTo("오브젝트")
        assertThat(listed.writtenSections).isEqualTo(1)
        assertThat(listed.totalSections).isEqualTo(3)
        assertThat(listed.sourceUrl).isEqualTo("https://www.yes24.com/product/goods/101")
    }

    @Test
    fun `a section links to its post only once it is published`() {
        val book = imported()
        publish(book.section("1.1"), slug = "ticket")
        adminBookService.writePost(book.section("1.2"))

        val shown = bookService.get(book.id)

        val sections = shown.chapters.first().sections
        assertThat(sections.map { it.number }).containsExactly("1.1", "1.2")
        assertThat(sections[0].post?.slug).isEqualTo("ticket")
        assertThat(sections[1].post).isNull()
        assertThat(shown.writtenSections).isEqualTo(1)
    }

    @Test
    fun `an unknown book is not found`() {
        assertThatThrownBy { bookService.get(UUID.randomUUID()) }
            .isInstanceOfSatisfying(
                BlogException::class.java,
            ) { assertThat(it.error).isEqualTo(BlogError.BOOK_NOT_FOUND) }
    }
}
