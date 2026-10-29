package blog.book.service

import blog.MutableClock
import blog.ServerSentEvents
import blog.TestcontainersConfiguration
import blog.book.FakeBookSourceGateway
import blog.book.dto.request.BookImportRequest
import blog.book.dto.response.AdminBookResponse
import blog.book.dto.response.StudyNoteResponse
import blog.common.exception.BlogError
import blog.common.exception.BlogException
import blog.common.web.EventStream
import blog.llm.FakeLlmGateway
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.jdbc.core.simple.JdbcClient
import java.time.Duration
import java.util.UUID

// Not @Transactional: the model must be asked outside any transaction.
@SpringBootTest
@Import(
    TestcontainersConfiguration::class,
    MutableClock.Config::class,
    FakeBookSourceGateway.Config::class,
    FakeLlmGateway.Config::class,
)
class StudyNoteServiceTest(
    @Autowired private val studyNoteService: StudyNoteService,
    @Autowired private val bookSourceService: BookSourceService,
    @Autowired private val fakeBookSourceGateway: FakeBookSourceGateway,
    @Autowired private val fakeLlmGateway: FakeLlmGateway,
    @Autowired private val clock: MutableClock,
    @Autowired private val jdbc: JdbcClient,
) {
    private lateinit var book: AdminBookResponse

    @BeforeEach
    fun importBook() {
        clear()
        fakeBookSourceGateway.holds("101")
        book = bookSourceService.import(BookImportRequest(sourceRef = "101", topicSlug = "spring"))
    }

    // Truncate fires no row trigger, so it clears the append-only rows as well; the api itself never does.
    @AfterEach
    fun clear() {
        jdbc.sql("truncate llm_call, study_note, ask_message, post_revision, post, book_section, book").update()
        fakeBookSourceGateway.reset()
        fakeLlmGateway.reset()
        clock.reset()
    }

    private fun section(): UUID =
        book.chapters
            .first()
            .sections
            .first()
            .id

    private fun record(call: (EventStream) -> Unit): ServerSentEvents {
        val recorder = ServerSentEvents.Recorder()
        call(recorder.stream)
        return recorder.events()
    }

    private fun noteOf(events: ServerSentEvents): StudyNoteResponse = events.done(StudyNoteResponse::class)

    private fun write(section: UUID): StudyNoteResponse = noteOf(record { studyNoteService.write(section, it) })

    private fun fails(
        error: BlogError,
        call: () -> Unit,
    ) {
        assertThatThrownBy(call).isInstanceOfSatisfying(BlogException::class.java) {
            assertThat(it.error).isEqualTo(error)
        }
    }

    @Test
    fun `a note is written from the book's, chapter's and section's names, outside any transaction`() {
        val events = record { studyNoteService.write(section(), it) }
        val note = noteOf(events)

        assertThat(events.names).containsExactly("text", "text", "text", "done")
        assertThat(events.text).isEqualTo(FakeLlmGateway.REPLY.text)
        val asked = fakeLlmGateway.asked.single()
        assertThat(
            asked.user,
        ).contains("<book>\nBook: 오브젝트\nAuthors: 조영호 저\nChapter: 1 객체, 설계\nSection: 1.1 티켓 판매\n</book>")
        assertThat(asked.maxTokens).isEqualTo(8_192)
        assertThat(fakeLlmGateway.inTransaction).containsExactly(false)
        assertThat(note.sectionId).isEqualTo(section())
        assertThat(note.bodyMdx).isEqualTo(FakeLlmGateway.REPLY.text)
        assertThat(note.model).isEqualTo("deepseek-flash")
        assertThat(note.inputTokens).isEqualTo(1_000)
        assertThat(note.outputTokens).isEqualTo(2_000)
        assertThat(note.createdAt).isEqualTo(clock.instant())
        assertThat(studyNoteService.get(section())).isEqualTo(note)
        assertThat(jdbc.sql("select purpose from llm_call").query(String::class.java).single()).isEqualTo("NOTE")
    }

    @Test
    fun `writing again keeps the old note and makes the new one the section's`() {
        val first = write(section())
        clock.advance(Duration.ofMinutes(5))
        fakeLlmGateway.answers("## 다시 쓴 노트")

        val second = write(section())

        assertThat(studyNoteService.get(section())).isEqualTo(second)
        assertThat(studyNoteService.find(section())?.bodyMdx).isEqualTo("## 다시 쓴 노트")
        assertThat(second.id).isNotEqualTo(first.id)
        assertThat(jdbc.sql("select count(*) from study_note").query(Int::class.java).single()).isEqualTo(2)
    }

    @Test
    fun `a section without a note has none to read`() {
        fails(BlogError.BOOK_NOTE_NOT_FOUND) { studyNoteService.get(section()) }
        assertThat(studyNoteService.find(section())).isNull()
    }

    @Test
    fun `an unknown section is not found, and the model is not asked`() {
        val unknown = UUID.fromString("019a3000-0000-7000-8000-00000000ffff")

        fails(BlogError.BOOK_SECTION_NOT_FOUND) { record { studyNoteService.write(unknown, it) } }
        fails(BlogError.BOOK_SECTION_NOT_FOUND) { studyNoteService.get(unknown) }
        assertThat(fakeLlmGateway.asked).isEmpty()
    }

    @Test
    fun `a model that fails leaves the section's note as it was`() {
        val kept = write(section())
        fakeLlmGateway.failing = BlogError.LLM_FAILED

        val failed = record { studyNoteService.write(section(), it) }

        assertThat(failed.names).containsExactly("error")
        assertThat(failed.single("error").get("code").asString()).isEqualTo("llm.failed")
        assertThat(studyNoteService.get(section())).isEqualTo(kept)
    }

    @Test
    fun `a stream that drops midway shows the reader its start, then an error, and saves no note`() {
        fakeLlmGateway.failingMidway = BlogError.LLM_FAILED

        val failed = record { studyNoteService.write(section(), it) }

        assertThat(failed.names).containsExactly("text", "error")
        assertThat(failed.text).isEqualTo("## 책임\n")
        fails(BlogError.BOOK_NOTE_NOT_FOUND) { studyNoteService.get(section()) }
    }

    @Test
    fun `without a key the refusal comes before any stream, as its own status`() {
        fakeLlmGateway.configured = false

        val recorder = ServerSentEvents.Recorder()
        fails(BlogError.LLM_UNAVAILABLE) { studyNoteService.write(section(), recorder.stream) }

        assertThat(recorder.response.isCommitted).isFalse()
        assertThat(recorder.response.contentAsString).isEmpty()
        assertThat(fakeLlmGateway.asked).isEmpty()
    }
}
