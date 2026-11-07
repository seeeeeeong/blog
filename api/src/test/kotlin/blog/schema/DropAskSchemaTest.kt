package blog.schema

import blog.TestcontainersConfiguration
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.dao.DataAccessException
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.jdbc.core.simple.JdbcClient
import org.springframework.transaction.annotation.Transactional
import java.time.OffsetDateTime
import java.util.UUID

@SpringBootTest
@Import(TestcontainersConfiguration::class)
@Transactional
class DropAskSchemaTest(
    @Autowired private val jdbc: JdbcClient,
) {
    private fun exists(table: String) =
        jdbc
            .sql("select to_regclass(:table) is not null")
            .param("table", table)
            .query(Boolean::class.java)
            .single()

    private fun call(purpose: String) =
        jdbc
            .sql(
                """
                insert into llm_call (id, purpose, model, input_tokens, output_tokens, cost_micros, created_at)
                values (:id, :purpose, 'm', 0, 0, 0, :at)
                """.trimIndent(),
            ).param("id", UUID.randomUUID())
            .param("purpose", purpose)
            .param("at", OffsetDateTime.parse("2026-11-07T00:00:00Z"))
            .update()

    @Test
    fun `the Ask tables are gone`() {
        assertThat(listOf("ask_message", "ask_daily_usage").map(::exists)).containsOnly(false)
    }

    @Test
    fun `a call can no longer be for Ask`() {
        assertThatThrownBy { call("ASK") }.isInstanceOf(DataIntegrityViolationException::class.java)
    }

    @Test
    fun `the editor's calls are still recorded, and the log is append-only again`() {
        assertThat(listOf("MEMO", "REVIEW").map(::call)).containsOnly(1)
        assertThatThrownBy {
            jdbc.sql("delete from llm_call").update()
        }.isInstanceOf(DataAccessException::class.java).hasMessageContaining("append-only")
    }
}
