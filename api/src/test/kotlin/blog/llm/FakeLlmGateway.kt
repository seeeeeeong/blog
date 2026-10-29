package blog.llm

import blog.common.exception.BlogError
import blog.common.exception.BlogException
import blog.llm.gateway.LlmChat
import blog.llm.gateway.LlmGateway
import blog.llm.gateway.LlmReply
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Primary
import org.springframework.transaction.support.TransactionSynchronizationManager
import java.util.Collections

/** Answers with what a test puts in it instead of calling DeepSeek, and remembers what it was asked. */
class FakeLlmGateway : LlmGateway {
    @Volatile
    var reply: LlmReply = REPLY

    @Volatile
    var failing: BlogError? = null

    val asked: MutableList<LlmChat> = Collections.synchronizedList(mutableListOf())

    /** Whether a transaction was open as each call reached the model, in order. */
    val inTransaction: MutableList<Boolean> = Collections.synchronizedList(mutableListOf())

    override fun complete(chat: LlmChat): LlmReply {
        asked += chat
        inTransaction += TransactionSynchronizationManager.isActualTransactionActive()
        failing?.let { throw BlogException(it) }
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
        failing = null
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
    }

    @TestConfiguration(proxyBeanMethods = false)
    class Config {
        @Bean
        @Primary
        fun fakeLlmGateway() = FakeLlmGateway()
    }
}
