package blog.book.service

import blog.book.dto.response.BookResponse
import blog.book.dto.response.BookSummaryResponse
import blog.book.repository.BookRepository
import blog.book.repository.BookSectionRepository
import blog.common.exception.BlogError
import blog.common.exception.BlogException
import blog.post.service.PostService
import blog.post.service.TopicService
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

/** Books as a reader sees them: a section links to its post only once that post is published. */
@Service
@Transactional(readOnly = true)
class BookService(
    private val bookRepository: BookRepository,
    private val bookSectionRepository: BookSectionRepository,
    private val postService: PostService,
    private val topicService: TopicService,
) {
    fun list(): List<BookSummaryResponse> {
        val books = bookRepository.findNewestFirst()
        if (books.isEmpty()) return emptyList()
        val sections = bookSectionRepository.findAllByBookIdIn(books.map { it.id })
        val published = postService.listPublishedForSections(sections.map { it.id })
        val topics = topicService.listById()
        val byBook = sections.groupBy { it.bookId }
        return books.map {
            BookSummaryResponse.from(
                book = it,
                topic = it.topicId?.let(topics::get),
                sections = byBook[it.id].orEmpty(),
                published = published,
            )
        }
    }

    fun get(id: UUID): BookResponse {
        val book = bookRepository.findByIdOrNull(id) ?: throw BlogException(BlogError.BOOK_NOT_FOUND)
        val sections = bookSectionRepository.findAllByBookId(book.id)
        val published = postService.listPublishedForSections(sections.map { it.id })
        val topic = book.topicId?.let { topicService.listById()[it] }
        return BookResponse.from(book = book, topic = topic, sections = sections, published = published)
    }
}
