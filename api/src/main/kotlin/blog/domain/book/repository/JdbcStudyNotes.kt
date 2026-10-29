package blog.domain.book.repository

import blog.domain.book.entity.StudyNote
import org.springframework.jdbc.core.simple.JdbcClient
import org.springframework.stereotype.Repository
import java.sql.ResultSet
import java.sql.Timestamp
import java.time.Instant
import java.util.UUID

/** Append-only: a trigger refuses an update or a delete, and nothing here asks for one. */
@Repository
class JdbcStudyNotes(
    private val jdbcClient: JdbcClient,
) {
    fun append(note: StudyNote) {
        jdbcClient
            .sql(
                """
                insert into study_note (id, section_id, body_mdx, model, input_tokens, output_tokens, created_at)
                values (:id, :sectionId, :bodyMdx, :model, :inputTokens, :outputTokens, :createdAt)
                """.trimIndent(),
            ).param("id", note.id)
            .param("sectionId", note.sectionId)
            .param("bodyMdx", note.bodyMdx)
            .param("model", note.model)
            .param("inputTokens", note.inputTokens)
            .param("outputTokens", note.outputTokens)
            .param("createdAt", Timestamp.from(note.createdAt))
            .update()
    }

    // The id breaks a tie: it is a UUIDv7, so a later note sorts later.
    fun latest(sectionId: UUID): StudyNote? =
        jdbcClient
            .sql(
                """
                select id, section_id, body_mdx, model, input_tokens, output_tokens, created_at
                from study_note
                where section_id = :sectionId
                order by created_at desc, id desc
                limit 1
                """.trimIndent(),
            ).param("sectionId", sectionId)
            .query { row, _ -> noteOf(row) }
            .optional()
            .orElse(null)

    /** When each of [sectionIds] that has a note last had one written. */
    fun latestDates(sectionIds: Collection<UUID>): Map<UUID, Instant> {
        if (sectionIds.isEmpty()) return emptyMap()
        return jdbcClient
            .sql("select section_id, max(created_at) from study_note where section_id in (:sectionIds) group by 1")
            .param("sectionIds", sectionIds)
            .query { row, _ -> row.getObject(1, UUID::class.java) to row.getTimestamp(2).toInstant() }
            .list()
            .toMap()
    }

    private fun noteOf(row: ResultSet) =
        StudyNote(
            sectionId = row.getObject("section_id", UUID::class.java),
            bodyMdx = row.getString("body_mdx"),
            model = row.getString("model"),
            inputTokens = row.getInt("input_tokens"),
            outputTokens = row.getInt("output_tokens"),
            now = row.getTimestamp("created_at").toInstant(),
            id = row.getObject("id", UUID::class.java),
        )
}
