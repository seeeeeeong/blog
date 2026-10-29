package blog.llm.service

import blog.common.exception.BlogError
import blog.common.exception.BlogException
import blog.llm.dto.request.LlmRequest
import blog.llm.dto.response.LlmResponse
import blog.llm.entity.LlmCall
import blog.llm.entity.LlmCostPolicy
import blog.llm.entity.LlmPurpose
import blog.llm.gateway.LlmChat
import blog.llm.gateway.LlmGateway
import blog.llm.repository.JdbcLlmCalls
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.math.BigDecimal
import java.time.Clock

/**
 * The model, asked under a monthly cap: every call that answers is recorded with its estimated
 * cost, and none goes out once the month's sum reaches the cap. No transaction is held while the
 * model writes.
 */
@Service
class LlmService(
    private val llmGateway: LlmGateway,
    private val jdbcLlmCalls: JdbcLlmCalls,
    @Value("\${blog.llm.monthly-cap-usd}") private val monthlyCapUsd: BigDecimal,
    @Value("\${blog.llm.price.input-per-million-usd}") inputPerMillion: BigDecimal,
    @Value("\${blog.llm.price.output-per-million-usd}") outputPerMillion: BigDecimal,
    private val clock: Clock,
) {
    private val prices = LlmCostPolicy.Prices(inputPerMillion = inputPerMillion, outputPerMillion = outputPerMillion)

    /** Throws what [stream] would refuse with before asking: no key, or the month's cap reached. */
    fun check() {
        if (!llmGateway.configured) throw BlogException(BlogError.LLM_UNAVAILABLE)
        // Two calls checked at once may both go out: one admin, so the cap is passed by a call at most.
        val spent = jdbcLlmCalls.spentSince(LlmCostPolicy.monthStart(clock.instant()), CAPPED)
        if (LlmCostPolicy.reached(spent, monthlyCapUsd)) throw BlogException(BlogError.LLM_MONTHLY_CAP_REACHED)
    }

    /**
     * Hands each piece of the answer to [onText] as the model writes it, then returns the whole. A
     * piece is provisional: an answer cut off at its limit is recorded but thrown as incomplete.
     */
    fun stream(
        request: LlmRequest,
        onText: (String) -> Unit,
    ): LlmResponse {
        check()
        val reply = llmGateway.stream(LlmChat(request.system, request.user, request.maxTokens), onText)
        val call =
            LlmCall(
                purpose = LlmPurpose.valueOf(request.purpose.name),
                model = reply.model,
                inputTokens = reply.inputTokens,
                outputTokens = reply.outputTokens,
                costMicros = LlmCostPolicy.costMicros(reply.inputTokens, reply.outputTokens, prices),
                now = clock.instant(),
            )
        jdbcLlmCalls.append(call)
        if (!reply.finished || reply.text.isBlank()) throw BlogException(BlogError.LLM_INCOMPLETE)
        return LlmResponse(
            text = reply.text,
            model = reply.model,
            inputTokens = reply.inputTokens,
            outputTokens = reply.outputTokens,
        )
    }

    private companion object {
        // A study note and a draft from a memo share one cap.
        val CAPPED = listOf(LlmPurpose.NOTE, LlmPurpose.MEMO)
    }
}
