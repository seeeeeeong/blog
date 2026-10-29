package blog.book.entity

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import java.time.Instant

class BookSectionTest {
    private val now = Instant.parse("2026-10-04T00:00:00Z")

    private val book =
        Book(
            title = "오브젝트",
            authors = "조영호 저",
            publisher = "위키북스",
            isbn13 = "9788998139766",
            publishedOn = null,
            sourceRef = "74219491",
            sourceUrl = "https://www.yes24.com/product/goods/74219491",
            coverUrl = null,
            topicId = null,
            now = now,
        )

    private val chapters =
        listOf(
            TocParser.Chapter(
                number = "1",
                title = "객체, 설계",
                sections = listOf(TocParser.Section("1.1", "티켓 판매"), TocParser.Section("1.2", "무엇이 문제인가")),
            ),
            TocParser.Chapter(number = "2", title = "객체지향", sections = emptyList()),
        )

    @Test
    fun `each chapter comes before its sections, which point at it and count from one`() {
        val sections = BookSection.sectionsOf(book, chapters, now)

        assertThat(sections.map { it.number }).containsExactly("1", "1.1", "1.2", "2")
        assertThat(sections.map { it.position }).containsExactly(1, 1, 2, 2)
        assertThat(sections.map { it.parentId }).containsExactly(null, sections[0].id, sections[0].id, null)
        assertThat(sections).allSatisfy { assertThat(it.bookId).isEqualTo(book.id) }
    }

    @Test
    fun `the leaves are the sections and the chapters that have none`() {
        val sections = BookSection.sectionsOf(book, chapters, now)

        assertThat(BookSection.leavesOf(sections).map { it.number }).containsExactly("1.1", "1.2", "2")
    }
}
