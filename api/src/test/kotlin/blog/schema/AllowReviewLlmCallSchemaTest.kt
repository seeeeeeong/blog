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
import java.time.OffsetDateTime
import java.util.UUID

@SpringBootTest
@Import(TestcontainersConfiguration::class)
@Transactional
class AllowReviewLlmCallSchemaTest(
    @Autowired private val jdbc: JdbcClient,
) {
    private fun call(purpose: String) =
        jdbc
            .sql(
                """
                insert into llm_call (id, purpose, model, input_tokens, output_tokens, cost_micros, created_at)
                values (:id, :purpose, 'm', 0, 0, 0, :at)
                """.trimIndent(),
            ).param("id", UUID.randomUUID())
            .param("purpose", purpose)
            .param("at", OffsetDateTime.parse("2026-11-05T00:00:00Z"))
            .update()

    @Test
    fun `a review is a purpose a call may have`() {
        assertThat(call("REVIEW")).isEqualTo(1)
    }

    @Test
    fun `an unknown purpose is still refused`() {
        assertThatThrownBy { call("OTHER") }.isInstanceOf(DataIntegrityViolationException::class.java)
    }
}
