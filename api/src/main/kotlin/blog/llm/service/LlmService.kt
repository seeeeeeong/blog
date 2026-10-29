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
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.stereotype.Service
import java.math.BigDecimal
import java.time.Clock

/**
 * The model, asked under a monthly cap: every call that answers is recorded with its estimated
 * cost, and none goes out once the month's sum reaches the cap. No transaction is held while the
 * model writes.
 */
@Service
@EnableConfigurationProperties(LlmSettings::class)
class LlmService(
    private val llmGateway: LlmGateway,
    private val jdbcLlmCalls: JdbcLlmCalls,
    llmSettings: LlmSettings,
    private val clock: Clock,
) {
    /** Purposes that share a monthly cap, and what a caller is told without a key or at the cap. */
    private data class Budget(
        val purposes: List<LlmPurpose>,
        val capUsd: BigDecimal,
        val unavailable: BlogError,
        val capReached: BlogError,
    )

    private val prices =
        LlmCostPolicy.Prices(
            inputPerMillion = llmSettings.price.inputPerMillionUsd,
            outputPerMillion = llmSettings.price.outputPerMillionUsd,
        )

    private val editor =
        Budget(
            purposes = listOf(LlmPurpose.NOTE, LlmPurpose.MEMO),
            capUsd = llmSettings.monthlyCapUsd,
            unavailable = BlogError.LLM_UNAVAILABLE,
            capReached = BlogError.LLM_MONTHLY_CAP_REACHED,
        )

    private val ask =
        Budget(
            purposes = listOf(LlmPurpose.ASK),
            capUsd = llmSettings.askMonthlyCapUsd,
            unavailable = BlogError.ASK_UNAVAILABLE,
            capReached = BlogError.ASK_MONTHLY_CAP_REACHED,
        )

    /** Throws what [stream] would refuse with before asking: no key, or the month's cap reached. */
    fun check(purpose: LlmRequest.Purpose) {
        val budget = if (purpose == LlmRequest.Purpose.ASK) ask else editor
        if (!llmGateway.configured) throw BlogException(budget.unavailable)
        // Calls checked at once may all go out, so a cap is passed by what those few cost, a cent or so each.
        val spent = jdbcLlmCalls.spentSince(LlmCostPolicy.monthStart(clock.instant()), budget.purposes)
        if (LlmCostPolicy.reached(spent, budget.capUsd)) throw BlogException(budget.capReached)
    }

    /**
     * Hands each piece of the answer to [onText] as the model writes it, then returns the whole. A
     * piece is provisional: an answer cut off at its limit is recorded but thrown as incomplete.
     */
    fun stream(
        request: LlmRequest,
        onText: (String) -> Unit,
    ): LlmResponse {
        check(request.purpose)
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
}
