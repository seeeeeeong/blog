package blog.book.service

import blog.book.dto.request.BookImportRequest
import blog.book.dto.request.BookSearchRequest
import blog.book.dto.response.AdminBookResponse
import blog.book.dto.response.BookEditionResponse
import blog.book.entity.TocParser
import blog.book.gateway.BookSourceGateway
import blog.book.gateway.SourcedBook
import blog.book.repository.BookRepository
import blog.common.exception.BlogError
import blog.common.exception.BlogException
import blog.post.service.TopicService
import org.springframework.stereotype.Service

/** Books as YES24 knows them, found and imported. No transaction is held while YES24 answers. */
@Service
class BookSourceService(
    private val bookSourceGateway: BookSourceGateway,
    private val bookSourceThrottle: BookSourceThrottle,
    private val bookRepository: BookRepository,
    private val adminBookService: AdminBookService,
    private val topicService: TopicService,
) {
    fun search(request: BookSearchRequest): List<BookEditionResponse> {
        val books = throttled { bookSourceGateway.search(request.q.trim()) }
        val imported = bookRepository.findAllBySourceRefIn(books.map { it.ref }).map { it.sourceRef }.toSet()
        return books.map { editionOf(it, imported = it.ref in imported) }
    }

    /** Stores the edition with its contents read into chapters and sections, the study path. */
    fun import(request: BookImportRequest): AdminBookResponse {
        if (bookRepository.existsBySourceRef(request.sourceRef)) throw BlogException(BlogError.BOOK_ALREADY_IMPORTED)
        val topicId = request.topicSlug?.let(topicService::idOf)
        val book =
            throttled { bookSourceGateway.find(request.sourceRef) } ?: throw BlogException(BlogError.BOOK_NOT_IN_SOURCE)
        return adminBookService.create(book, chaptersOf(book), topicId)
    }

    private fun chaptersOf(book: SourcedBook): List<TocParser.Chapter> =
        book.contents
            ?.let(TocParser::parse)
            .orEmpty()
            .ifEmpty { throw BlogException(BlogError.BOOK_CONTENTS_UNREADABLE) }

    private fun <T> throttled(call: () -> T): T {
        if (!bookSourceThrottle.tryAcquire()) throw BlogException(BlogError.BOOK_SOURCE_BUSY)
        return call()
    }

    private fun editionOf(
        book: SourcedBook,
        imported: Boolean,
    ) = BookEditionResponse(
        sourceRef = book.ref,
        sourceUrl = book.url,
        title = book.title,
        authors = book.authors,
        publisher = book.publisher,
        isbn13 = book.isbn13,
        publishedOn = book.publishedOn,
        coverUrl = book.coverUrl,
        hasContents = book.contents?.let(TocParser::parse)?.isNotEmpty() == true,
        imported = imported,
    )
}
