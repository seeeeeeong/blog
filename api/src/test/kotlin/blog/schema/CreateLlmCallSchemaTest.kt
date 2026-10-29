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
import java.util.UUID

@SpringBootTest
@Import(TestcontainersConfiguration::class)
@Transactional
class CreateLlmCallSchemaTest(
    @Autowired private val jdbc: JdbcClient,
) {
    private fun call(
        purpose: String = "NOTE",
        model: String = "deepseek-flash",
        inputTokens: Int = 412,
        costMicros: Long = 2_320,
    ): UUID {
        val id = UUID.randomUUID()
        jdbc
            .sql(
                """
                insert into llm_call (id, purpose, model, input_tokens, output_tokens, cost_micros, created_at)
                values (:id, :purpose, :model, :inputTokens, 1830, :costMicros, now())
                """.trimIndent(),
            ).param("id", id)
            .param("purpose", purpose)
            .param("model", model)
            .param("inputTokens", inputTokens)
            .param("costMicros", costMicros)
            .update()
        return id
    }

    @Test
    fun `a call is recorded for a study note or a draft from a memo`() {
        call(purpose = "NOTE")
        call(purpose = "MEMO")

        val count = jdbc.sql("select count(*) from llm_call").query(Int::class.java).single()
        assertThat(count).isEqualTo(2)
    }

    @Test
    fun `a call is never changed`() {
        val id = call()

        assertThatThrownBy {
            jdbc.sql("update llm_call set cost_micros = 0 where id = :id").param("id", id).update()
        }.isInstanceOf(DataAccessException::class.java).hasMessageContaining("append-only")
    }

    @Test
    fun `a call is never deleted`() {
        val id = call()

        assertThatThrownBy {
            jdbc.sql("delete from llm_call where id = :id").param("id", id).update()
        }.isInstanceOf(DataAccessException::class.java).hasMessageContaining("append-only")
    }

    @Test
    fun `a call has a known purpose`() {
        assertThatThrownBy { call(purpose = "ASK") }.isInstanceOf(DataIntegrityViolationException::class.java)
    }

    @Test
    fun `a call names its model`() {
        assertThatThrownBy { call(model = "") }.isInstanceOf(DataIntegrityViolationException::class.java)
    }

    @Test
    fun `tokens are never negative`() {
        assertThatThrownBy { call(inputTokens = -1) }.isInstanceOf(DataIntegrityViolationException::class.java)
    }

    @Test
    fun `a cost is never negative`() {
        assertThatThrownBy { call(costMicros = -1) }.isInstanceOf(DataIntegrityViolationException::class.java)
    }
}
