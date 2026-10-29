package blog.domain.llm

import blog.common.exception.BlogError
import blog.common.exception.BlogException
import blog.domain.llm.gateway.LlmChat
import blog.domain.llm.gateway.LlmGateway
import blog.domain.llm.gateway.LlmReply
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Primary
import org.springframework.transaction.support.TransactionSynchronizationManager
import java.util.Collections

/**
 * Streams what a test puts in it, a line at a time, instead of calling DeepSeek, and remembers what
 * it was asked.
 */
class FakeLlmGateway : LlmGateway {
    @Volatile
    var reply: LlmReply = REPLY

    @Volatile
    override var configured: Boolean = true

    /** Thrown before the first piece. */
    @Volatile
    var failing: BlogError? = null

    /** Thrown after the first piece, as a stream that drops. */
    @Volatile
    var failingMidway: BlogError? = null

    val asked: MutableList<LlmChat> = Collections.synchronizedList(mutableListOf())

    /** Whether a transaction was open as each call reached the model, in order. */
    val inTransaction: MutableList<Boolean> = Collections.synchronizedList(mutableListOf())

    override fun stream(
        chat: LlmChat,
        onText: (String) -> Unit,
    ): LlmReply {
        asked += chat
        inTransaction += TransactionSynchronizationManager.isActualTransactionActive()
        failing?.let { throw BlogException(it) }
        piecesOf(reply.text).forEachIndexed { index, piece ->
            if (index == 1) failingMidway?.let { throw BlogException(it) }
            onText(piece)
        }
        return reply
    }

    fun answers(
        text: String,
        inputTokens: Int = 1_000,
        outputTokens: Int = 2_000,
    ) {
        reply = REPLY.copy(text = text, inputTokens = inputTokens, outputTokens = outputTokens)
    }

    fun reset() {
        reply = REPLY
        configured = true
        failing = null
        failingMidway = null
        asked.clear()
        inTransaction.clear()
    }

    companion object {
        val REPLY =
            LlmReply(
                text = "## 책임\n\n객체는 책임을 가집니다.",
                model = "deepseek-flash",
                inputTokens = 1_000,
                outputTokens = 2_000,
                finished = true,
            )

        /** Each line with its line break, as a model's pieces would add up to the text. */
        fun piecesOf(text: String): List<String> = Regex("[^\n]*\n|[^\n]+").findAll(text).map { it.value }.toList()
    }

    @TestConfiguration(proxyBeanMethods = false)
    class Config {
        @Bean
        @Primary
        fun fakeLlmGateway() = FakeLlmGateway()
    }
}
