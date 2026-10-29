package blog.domain.book.entity

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import java.time.Instant
import java.util.UUID

class StudyNoteTest {
    @Test
    fun `a note is dated to the microsecond, as PostgreSQL keeps it`() {
        val note =
            StudyNote(
                sectionId = UUID.randomUUID(),
                bodyMdx = "## 노트",
                model = "deepseek-flash",
                inputTokens = 1,
                outputTokens = 1,
                now = Instant.parse("2026-10-29T10:47:37.123456789Z"),
            )

        assertThat(note.createdAt).isEqualTo(Instant.parse("2026-10-29T10:47:37.123456Z"))
    }
}
