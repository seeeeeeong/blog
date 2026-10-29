package blog.book.service

import blog.TestcontainersConfiguration
import blog.book.FakeBookSourceGateway
import blog.book.dto.request.BookImportRequest
import blog.book.dto.request.BookTopicRequest
import blog.book.dto.response.AdminBookResponse
import blog.common.exception.BlogError
import blog.common.exception.BlogException
import blog.post.entity.PostStatus
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
class AdminBookServiceTest(
    @Autowired private val adminBookService: AdminBookService,
    @Autowired private val bookSourceService: BookSourceService,
    @Autowired private val fakeBookSourceGateway: FakeBookSourceGateway,
) {
    @BeforeEach
    fun reset() {
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

    private fun imported(
        ref: String = "101",
        topicSlug: String? = "spring",
    ): AdminBookResponse {
        fakeBookSourceGateway.holds(ref)
        return bookSourceService.import(BookImportRequest(sourceRef = ref, topicSlug = topicSlug))
    }

    private fun AdminBookResponse.section(number: String) =
        chapters.flatMap { listOf(it) + it.sections }.single { it.number == number }

    @Test
    fun `writing a post for a section makes a draft in the book's topic, titled as the section`() {
        val book = imported()

        val written = adminBookService.writePost(book.section("1.1").id)

        assertThat(written.created).isTrue()
        assertThat(written.post.status).isEqualTo(PostStatus.DRAFT)
        assertThat(written.post.title).isEqualTo("티켓 판매")
        assertThat(written.post.topic.slug).isEqualTo("spring")
        assertThat(written.post.sectionId).isEqualTo(book.section("1.1").id)
        assertThat(written.post.slug).isEqualTo("post")
    }

    @Test
    fun `a section keeps the one post it has, and the book shows it`() {
        val book = imported()
        val first = adminBookService.writePost(book.section("1.1").id)

        val again = adminBookService.writePost(book.section("1.1").id)
        val other = adminBookService.writePost(book.section("2.1").id)
        val shown = adminBookService.get(book.id)

        assertThat(again.created).isFalse()
        assertThat(again.post.id).isEqualTo(first.post.id)
        assertThat(other.post.position).isEqualTo(first.post.position + 1)
        assertThat(shown.section("1.1").post?.id).isEqualTo(first.post.id)
        assertThat(shown.section("1.2").post).isNull()
    }

    @Test
    fun `a book without a topic takes one before its first post`() {
        val book = imported(topicSlug = null)
        val section = book.section("1.1").id

        fails(BlogError.BOOK_TOPIC_REQUIRED) { adminBookService.writePost(section) }
        val placed = adminBookService.placeInTopic(book.id, BookTopicRequest(topicSlug = "os"))

        assertThat(placed.topic?.slug).isEqualTo("os")
        assertThat(
            adminBookService
                .writePost(section)
                .post.topic.slug,
        ).isEqualTo("os")
    }

    @Test
    fun `a book's topic is changed or cleared, and an unknown one refused`() {
        val book = imported()

        fails(BlogError.POST_TOPIC_NOT_FOUND) { adminBookService.placeInTopic(book.id, BookTopicRequest("cooking")) }
        assertThat(adminBookService.placeInTopic(book.id, BookTopicRequest(topicSlug = null)).topic).isNull()
    }

    @Test
    fun `the admin lists every book, the latest import first`() {
        imported(ref = "101")
        imported(ref = "102")

        assertThat(adminBookService.list().map { it.sourceRef }).containsExactly("102", "101")
    }

    @Test
    fun `an unknown book or section is not found`() {
        fails(BlogError.BOOK_NOT_FOUND) { adminBookService.get(UUID.randomUUID()) }
        fails(BlogError.BOOK_SECTION_NOT_FOUND) { adminBookService.writePost(UUID.randomUUID()) }
    }
}
