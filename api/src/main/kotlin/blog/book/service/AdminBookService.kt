package blog.book.service

import blog.book.dto.request.BookTopicRequest
import blog.book.dto.response.AdminBookResponse
import blog.book.dto.response.AdminBookSectionResponse
import blog.book.dto.response.SectionPostResponse
import blog.book.entity.Book
import blog.book.entity.BookSection
import blog.book.entity.TocParser
import blog.book.gateway.SourcedBook
import blog.book.repository.BookRepository
import blog.book.repository.BookSectionRepository
import blog.book.repository.JdbcStudyNotes
import blog.common.exception.BlogError
import blog.common.exception.BlogException
import blog.post.dto.request.PostCreateRequest
import blog.post.service.SectionPostService
import blog.post.service.TopicService
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.util.UUID

/** Books as the admin keeps them, and the post each section gets. */
@Service
@Transactional
class AdminBookService(
    private val bookRepository: BookRepository,
    private val bookSectionRepository: BookSectionRepository,
    private val jdbcStudyNotes: JdbcStudyNotes,
    private val sectionPostService: SectionPostService,
    private val topicService: TopicService,
    private val clock: Clock,
) {
    @Transactional(readOnly = true)
    fun list(): List<AdminBookResponse> {
        val books = bookRepository.findNewestFirst()
        if (books.isEmpty()) return emptyList()
        val sections = bookSectionRepository.findAllByBookIdIn(books.map { it.id })
        val posts = sectionPostService.list(sections.map { it.id })
        val notes = jdbcStudyNotes.latestDates(sections.map { it.id })
        val topics = topicService.listById()
        val byBook = sections.groupBy { it.bookId }
        return books.map {
            val chapters = AdminBookSectionResponse.treeOf(byBook[it.id].orEmpty(), posts, notes)
            AdminBookResponse.from(book = it, topic = it.topicId?.let(topics::get), chapters = chapters)
        }
    }

    @Transactional(readOnly = true)
    fun get(id: UUID): AdminBookResponse = responseOf(find(id))

    fun create(
        sourced: SourcedBook,
        chapters: List<TocParser.Chapter>,
        topicId: UUID?,
    ): AdminBookResponse {
        val now = clock.instant()
        val book =
            Book(
                title = sourced.title,
                authors = sourced.authors,
                publisher = sourced.publisher,
                isbn13 = sourced.isbn13,
                publishedOn = sourced.publishedOn,
                sourceRef = sourced.ref,
                sourceUrl = sourced.url,
                coverUrl = sourced.coverUrl,
                topicId = topicId,
                now = now,
            )
        // A second import of the same edition, sent while the first waited on YES24, meets its row here.
        try {
            bookRepository.saveAndFlush(book)
        } catch (exception: DataIntegrityViolationException) {
            throw BlogException(BlogError.BOOK_ALREADY_IMPORTED, exception)
        }
        bookSectionRepository.saveAll(BookSection.sectionsOf(book, chapters, now))
        return responseOf(book)
    }

    fun placeInTopic(
        id: UUID,
        request: BookTopicRequest,
    ): AdminBookResponse {
        val book = find(id)
        val topicId = request.topicSlug?.let(topicService::idOf)
        book.placeIn(topicId)
        bookRepository.save(book)
        return responseOf(book)
    }

    /** The section's post: the one it has, or a new draft in the book's topic, titled as the section. */
    fun writePost(sectionId: UUID): SectionPostResponse {
        val section =
            bookSectionRepository.findByIdOrNull(sectionId) ?: throw BlogException(BlogError.BOOK_SECTION_NOT_FOUND)
        sectionPostService.find(section.id)?.let { return SectionPostResponse(it, created = false) }
        val book = checkNotNull(bookRepository.findByIdOrNull(section.bookId)) { "A section's book is kept" }
        val topicId = book.topicId ?: throw BlogException(BlogError.BOOK_TOPIC_REQUIRED)
        val topic = topicService.listById().getValue(topicId)
        val request = PostCreateRequest(title = section.title, topicSlug = topic.slug)
        val post = sectionPostService.create(section.id, request)
        return SectionPostResponse(post, created = true)
    }

    private fun responseOf(book: Book): AdminBookResponse {
        val sections = bookSectionRepository.findAllByBookId(book.id)
        val posts = sectionPostService.list(sections.map { it.id })
        val notes = jdbcStudyNotes.latestDates(sections.map { it.id })
        val topic = book.topicId?.let { topicService.listById()[it] }
        val chapters = AdminBookSectionResponse.treeOf(sections, posts, notes)
        return AdminBookResponse.from(book = book, topic = topic, chapters = chapters)
    }

    private fun find(id: UUID): Book =
        bookRepository.findByIdOrNull(id) ?: throw BlogException(BlogError.BOOK_NOT_FOUND)
}
