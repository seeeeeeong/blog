package blog.book.service

import blog.book.dto.response.StudyNoteResponse
import blog.book.entity.BookSection
import blog.book.entity.StudyNote
import blog.book.entity.StudyNotePrompt
import blog.book.repository.BookRepository
import blog.book.repository.BookSectionRepository
import blog.book.repository.JdbcStudyNotes
import blog.common.exception.BlogError
import blog.common.exception.BlogException
import blog.common.web.EventStream
import blog.llm.dto.request.LlmRequest
import blog.llm.service.LlmService
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Service
import java.time.Clock
import java.util.UUID

/**
 * Each section's private study note, written by the model. No transaction is held while it writes:
 * the section is read before, and the note appended after.
 */
@Service
class StudyNoteService(
    private val bookRepository: BookRepository,
    private val bookSectionRepository: BookSectionRepository,
    private val jdbcStudyNotes: JdbcStudyNotes,
    private val llmService: LlmService,
    private val clock: Clock,
) {
    /**
     * A new note for the section, streamed to [events] as the model writes it. Only a whole note is
     * saved, which becomes the section's latest and ends the stream as `done`.
     */
    fun write(
        sectionId: UUID,
        events: EventStream,
    ) {
        val prompt = StudyNotePrompt.of(subjectOf(section(sectionId)))
        val request =
            LlmRequest(
                purpose = LlmRequest.Purpose.NOTE,
                system = prompt.system,
                user = prompt.user,
                maxTokens = StudyNotePrompt.MAX_TOKENS,
            )
        llmService.check(request.purpose)
        events.stream {
            val written = llmService.stream(request, events::text)
            val note =
                StudyNote(
                    sectionId = sectionId,
                    bodyMdx = written.text,
                    model = written.model,
                    inputTokens = written.inputTokens,
                    outputTokens = written.outputTokens,
                    now = clock.instant(),
                )
            jdbcStudyNotes.append(note)
            events.done(StudyNoteResponse.from(note))
        }
    }

    fun get(sectionId: UUID): StudyNoteResponse {
        val section = section(sectionId)
        return find(section.id) ?: throw BlogException(BlogError.BOOK_NOTE_NOT_FOUND)
    }

    /** The section's latest note, or null; the post feature asks here for a draft's reference. */
    fun find(sectionId: UUID): StudyNoteResponse? = jdbcStudyNotes.latest(sectionId)?.let(StudyNoteResponse::from)

    private fun subjectOf(section: BookSection): StudyNotePrompt.Subject {
        val book = checkNotNull(bookRepository.findByIdOrNull(section.bookId)) { "A section's book is kept" }
        val chapter = section.parentId?.let { checkNotNull(bookSectionRepository.findByIdOrNull(it)) }
        return StudyNotePrompt.Subject(
            bookTitle = book.title,
            authors = book.authors,
            chapter = chapter?.let { "${it.number} ${it.title}" },
            section = "${section.number} ${section.title}",
        )
    }

    private fun section(id: UUID): BookSection =
        bookSectionRepository.findByIdOrNull(id) ?: throw BlogException(BlogError.BOOK_SECTION_NOT_FOUND)
}
