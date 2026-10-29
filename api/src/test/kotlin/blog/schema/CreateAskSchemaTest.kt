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
import java.time.LocalDate
import java.util.UUID

@SpringBootTest
@Import(TestcontainersConfiguration::class)
@Transactional
class CreateAskSchemaTest(
    @Autowired private val jdbc: JdbcClient,
) {
    private val hash = "a".repeat(64)

    private fun usage(
        ipHash: String = hash,
        day: LocalDate = LocalDate.of(2026, 10, 29),
        count: Int = 1,
    ) {
        jdbc
            .sql("insert into ask_daily_usage (ip_hash, day, count) values (:ipHash, :day, :count)")
            .param("ipHash", ipHash)
            .param("day", day)
            .param("count", count)
            .update()
    }

    private fun message(
        role: String = "USER",
        content: String = "TCP 는 왜 세 번 인사하나요?",
        grounded: Boolean? = null,
        postId: UUID? = null,
    ): UUID {
        val id = UUID.randomUUID()
        jdbc
            .sql(
                """
                insert into ask_message (id, conversation_id, post_id, role, content, grounded, created_at)
                values (:id, :conversationId, :postId, :role, :content, :grounded, now())
                """.trimIndent(),
            ).param("id", id)
            .param("conversationId", UUID.randomUUID())
            .param("postId", postId)
            .param("role", role)
            .param("content", content)
            .param("grounded", grounded)
            .update()
        return id
    }

    @Test
    fun `an ask call is recorded against its own purpose`() {
        jdbc
            .sql(
                """
                insert into llm_call (id, purpose, model, input_tokens, output_tokens, cost_micros, created_at)
                values (gen_random_uuid(), 'ASK', 'deepseek-flash', 1, 1, 1, now())
                """.trimIndent(),
            ).update()

        val purposes = jdbc.sql("select purpose from llm_call").query(String::class.java).list()
        assertThat(purposes).containsExactly("ASK")
    }

    @Test
    fun `a reader's day is counted in one row`() {
        usage()

        assertThatThrownBy { usage() }.isInstanceOf(DataIntegrityViolationException::class.java)
    }

    @Test
    fun `a reader is counted under a hash, never an address`() {
        assertThatThrownBy { usage(ipHash = "203.0.113.7") }.isInstanceOf(DataIntegrityViolationException::class.java)
    }

    @Test
    fun `a day's row counts at least one question`() {
        assertThatThrownBy { usage(count = 0) }.isInstanceOf(DataIntegrityViolationException::class.java)
    }

    @Test
    fun `a question and its answer are logged, only the answer grounded or not`() {
        message(role = "USER", grounded = null)
        message(role = "ASSISTANT", content = "세 번 주고받아 서로의 순서 번호를 맞춥니다.", grounded = true)

        val roles = jdbc.sql("select role from ask_message order by role desc").query(String::class.java).list()
        assertThat(roles).containsExactly("USER", "ASSISTANT")
    }

    @Test
    fun `a question is neither grounded nor not`() {
        assertThatThrownBy { message(role = "USER", grounded = false) }
            .isInstanceOf(DataIntegrityViolationException::class.java)
    }

    @Test
    fun `an answer is grounded or not`() {
        assertThatThrownBy { message(role = "ASSISTANT", grounded = null) }
            .isInstanceOf(DataIntegrityViolationException::class.java)
    }

    @Test
    fun `a message is the reader's or the model's`() {
        assertThatThrownBy { message(role = "SYSTEM") }.isInstanceOf(DataIntegrityViolationException::class.java)
    }

    @Test
    fun `a message says something`() {
        assertThatThrownBy { message(content = " ") }.isInstanceOf(DataIntegrityViolationException::class.java)
    }

    @Test
    fun `a message asked on a post names a post that exists`() {
        assertThatThrownBy { message(postId = UUID.randomUUID()) }
            .isInstanceOf(DataIntegrityViolationException::class.java)
    }

    @Test
    fun `a message is never changed`() {
        val id = message()

        assertThatThrownBy {
            jdbc.sql("update ask_message set content = '고침' where id = :id").param("id", id).update()
        }.isInstanceOf(DataAccessException::class.java).hasMessageContaining("append-only")
    }

    @Test
    fun `a message is never deleted`() {
        val id = message()

        assertThatThrownBy {
            jdbc.sql("delete from ask_message where id = :id").param("id", id).update()
        }.isInstanceOf(DataAccessException::class.java).hasMessageContaining("append-only")
    }
}
