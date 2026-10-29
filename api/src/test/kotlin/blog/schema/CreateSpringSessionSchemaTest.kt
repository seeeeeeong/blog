package blog.schema

import blog.TestcontainersConfiguration
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.jdbc.core.simple.JdbcClient
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@SpringBootTest
@Import(TestcontainersConfiguration::class)
@Transactional
class CreateSpringSessionSchemaTest(
    @Autowired private val jdbc: JdbcClient,
) {
    private fun session(
        id: String = UUID.randomUUID().toString(),
        sessionId: String = UUID.randomUUID().toString(),
    ): String {
        jdbc
            .sql(
                """
                insert into spring_session (primary_id, session_id, creation_time, last_access_time,
                                            max_inactive_interval, expiry_time)
                values (:id, :sessionId, 0, 0, 60, 0)
                """.trimIndent(),
            ).param("id", id)
            .param("sessionId", sessionId)
            .update()
        return id
    }

    private fun attribute(sessionPrimaryId: String) =
        jdbc
            .sql("insert into spring_session_attributes values (:id, 'SPRING_SECURITY_CONTEXT', '\\x00'::bytea)")
            .param("id", sessionPrimaryId)
            .update()

    @Test
    fun `an expired session's attributes are deleted with it`() {
        // Spring Session's cleanup deletes only from spring_session and relies on the cascade.
        val id = session()
        attribute(id)

        jdbc.sql("delete from spring_session where primary_id = :id").param("id", id).update()

        val left =
            jdbc
                .sql("select count(*) from spring_session_attributes where session_primary_id = :id")
                .param("id", id)
                .query(Int::class.java)
                .single()
        assertThat(left).isZero()
    }

    @Test
    fun `a session id names one session`() {
        val sessionId = UUID.randomUUID().toString()
        session(sessionId = sessionId)

        assertThatThrownBy { session(sessionId = sessionId) }.isInstanceOf(DataIntegrityViolationException::class.java)
    }

    @Test
    fun `an attribute belongs to a session that exists`() {
        assertThatThrownBy { attribute(UUID.randomUUID().toString()) }
            .isInstanceOf(DataIntegrityViolationException::class.java)
    }
}
