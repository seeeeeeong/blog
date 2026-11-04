package blog.domain.llm.service

import blog.MutableClock
import blog.TestcontainersConfiguration
import blog.common.exception.BlogError
import blog.common.exception.BlogException
import blog.domain.llm.FakeLlmGateway
import blog.domain.llm.dto.request.LlmRequest
import blog.domain.llm.repository.JdbcLlmCalls
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.jdbc.core.simple.JdbcClient
import java.sql.Timestamp
import java.time.Instant
import java.util.UUID

// Not @Transactional: the model must be asked outside any transaction.
@SpringBootTest(properties = ["blog.llm.ask.model=ask-model"])
@Import(TestcontainersConfiguration::class, MutableClock.Config::class, FakeLlmGateway.Config::class)
class LlmServiceTest(
    @Autowired private val llmService: LlmService,
    @Autowired private val fakeLlmGateway: FakeLlmGateway,
    @Autowired private val clock: MutableClock,
    @Autowired private val jdbc: JdbcClient,
    @Autowired private val jdbcLlmCalls: JdbcLlmCalls,
    @Autowired private val llmSettings: LlmSettings,
) {
    @BeforeEach
    @AfterEach
    fun clear() {
        jdbc.sql("truncate llm_call").update()
        fakeLlmGateway.reset()
        clock.reset()
    }

    private val request =
        LlmRequest(purpose = LlmRequest.Purpose.MEMO, system = "rules", user = "material", maxTokens = 8_192)

    private val pieces = mutableListOf<String>()

    private fun write() = llmService.stream(request) { pieces += it }

    private fun fails(
        error: BlogError,
        call: () -> Unit,
    ) {
        assertThatThrownBy(call).isInstanceOfSatisfying(BlogException::class.java) {
            assertThat(it.error).isEqualTo(error)
        }
    }

    @Test
    fun `a use's model goes to the gateway that serves it, whose key decides`() {
        val deepSeek = FakeLlmGateway().apply { serving = { it.startsWith("deepseek-") } }
        val claude = FakeLlmGateway().apply { serving = { it.startsWith("claude-") } }
        val settings =
            llmSettings.copy(
                memo = llmSettings.memo.copy(model = "claude-opus-5-5"),
                ask = llmSettings.ask.copy(model = "deepseek-flash"),
            )
        val service =
            LlmService(
                llmGateways = listOf(deepSeek, claude),
                jdbcLlmCalls = jdbcLlmCalls,
                llmSettings = settings,
                clock = clock,
            )

        service.stream(request) {}

        assertThat(claude.asked.single().model).isEqualTo("claude-opus-5-5")
        assertThat(deepSeek.asked).isEmpty()

        claude.configured = false
        fails(BlogError.LLM_UNAVAILABLE) { service.check(LlmRequest.Purpose.MEMO) }
        service.check(LlmRequest.Purpose.ASK)
    }

    @Test
    fun `each use asks the model set for it`() {
        write()
        llmService.stream(request.copy(purpose = LlmRequest.Purpose.ASK)) {}

        assertThat(fakeLlmGateway.asked.map { it.model }).containsExactly("deepseek-flash", "ask-model")
    }

    private fun spent(
        micros: Long,
        at: Instant,
        purpose: String = "MEMO",
    ) {
        jdbc
            .sql(
                """
                insert into llm_call (id, purpose, model, input_tokens, output_tokens, cost_micros, created_at)
                values (:id, :purpose, 'deepseek-flash', 0, 0, :micros, :at)
                """.trimIndent(),
            ).param("id", UUID.randomUUID())
            .param("purpose", purpose)
            .param("micros", micros)
            .param("at", Timestamp.from(at))
            .update()
    }

    private fun calls() =
        jdbc
            .sql("select purpose, model, input_tokens, output_tokens, cost_micros, created_at from llm_call")
            .query { row, _ ->
                listOf(
                    row.getString(1),
                    row.getString(2),
                    row.getInt(3),
                    row.getInt(4),
                    row.getLong(5),
                    row.getTimestamp(6).toInstant(),
                )
            }.list()

    @Test
    fun `an answer is returned and its call recorded with its cost, outside any transaction`() {
        val answer = write()

        assertThat(answer.text).isEqualTo(FakeLlmGateway.REPLY.text)
        assertThat(pieces).containsExactly("## 책임\n", "\n", "객체는 책임을 가집니다.")
        assertThat(answer.model).isEqualTo("deepseek-flash")
        assertThat(answer.inputTokens).isEqualTo(1_000)
        assertThat(answer.outputTokens).isEqualTo(2_000)
        assertThat(fakeLlmGateway.asked.single().maxTokens).isEqualTo(8_192)
        assertThat(fakeLlmGateway.asked.single().system).isEqualTo("rules")
        assertThat(fakeLlmGateway.inTransaction).containsExactly(false)
        // 1,000 input tokens at $0.30 and 2,000 output at $1.20 a million.
        assertThat(calls()).containsExactly(listOf("MEMO", "deepseek-flash", 1_000, 2_000, 2_700L, clock.instant()))
    }

    @Test
    fun `once the month's calls reach the cap, nothing more is asked`() {
        spent(micros = 9_997_300, at = clock.instant())

        write()

        fails(BlogError.LLM_MONTHLY_CAP_REACHED) { write() }
        assertThat(fakeLlmGateway.asked).hasSize(1)
        assertThat(calls()).hasSize(2)
    }

    @Test
    fun `the cap starts over at midnight on the first in Korea`() {
        // 23:59 on 31 October in Korea.
        clock.set(Instant.parse("2026-10-31T14:59:00Z"))
        spent(micros = 10_000_000, at = clock.instant())

        fails(BlogError.LLM_MONTHLY_CAP_REACHED) { write() }

        clock.set(Instant.parse("2026-10-31T15:00:00Z"))
        assertThat(write().text).isEqualTo(FakeLlmGateway.REPLY.text)
    }

    @Test
    fun `last month's calls count for nothing, this month's from its first instant`() {
        clock.set(Instant.parse("2026-10-15T00:00:00Z"))
        spent(micros = 50_000_000, at = Instant.parse("2026-09-30T14:59:59Z"))
        spent(micros = 9_999_999, at = Instant.parse("2026-09-30T15:00:00Z"))

        write()

        fails(BlogError.LLM_MONTHLY_CAP_REACHED) { write() }
    }

    @Test
    fun `an answer cut off at its limit is billed and recorded, but not returned`() {
        fakeLlmGateway.reply = FakeLlmGateway.REPLY.copy(finished = false, outputTokens = 8_192)

        fails(BlogError.LLM_INCOMPLETE) { write() }
        assertThat(calls().single()[3]).isEqualTo(8_192)
    }

    @Test
    fun `a check before asking refuses without a key and at the cap, and asks nothing`() {
        fakeLlmGateway.configured = false

        fails(BlogError.LLM_UNAVAILABLE) { llmService.check(LlmRequest.Purpose.MEMO) }
        fails(BlogError.LLM_UNAVAILABLE) { write() }

        fakeLlmGateway.configured = true
        llmService.check(LlmRequest.Purpose.MEMO)
        spent(micros = 10_000_000, at = clock.instant())
        fails(BlogError.LLM_MONTHLY_CAP_REACHED) { llmService.check(LlmRequest.Purpose.MEMO) }
        assertThat(fakeLlmGateway.asked).isEmpty()
    }

    @Test
    fun `Ask has a cap of its own, apart from the editor's, and its own errors`() {
        val ask = request.copy(purpose = LlmRequest.Purpose.ASK)
        spent(micros = 10_000_000, at = clock.instant(), purpose = "MEMO")

        fails(BlogError.LLM_MONTHLY_CAP_REACHED) { write() }
        llmService.stream(ask) {}
        spent(micros = 29_999_999, at = clock.instant(), purpose = "ASK")

        fails(BlogError.ASK_MONTHLY_CAP_REACHED) { llmService.check(LlmRequest.Purpose.ASK) }
        fakeLlmGateway.configured = false
        fails(BlogError.ASK_UNAVAILABLE) { llmService.check(LlmRequest.Purpose.ASK) }
        assertThat(calls().map { it[0] }).containsExactlyInAnyOrder("MEMO", "ASK", "ASK")
    }

    @Test
    fun `a stream that drops midway records nothing and returns nothing`() {
        fakeLlmGateway.failingMidway = BlogError.LLM_FAILED

        fails(BlogError.LLM_FAILED) { write() }
        assertThat(pieces).containsExactly("## 책임\n")
        assertThat(calls()).isEmpty()
    }

    @Test
    fun `a call that failed records nothing`() {
        fakeLlmGateway.failing = BlogError.LLM_FAILED

        fails(BlogError.LLM_FAILED) { write() }
        assertThat(calls()).isEmpty()
    }
}
