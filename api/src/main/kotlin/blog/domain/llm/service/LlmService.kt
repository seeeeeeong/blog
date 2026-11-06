package blog.domain.llm.service

import blog.common.exception.BlogError
import blog.common.exception.BlogException
import blog.domain.llm.dto.request.LlmRequest
import blog.domain.llm.dto.response.LlmResponse
import blog.domain.llm.entity.LlmCall
import blog.domain.llm.entity.LlmCostPolicy
import blog.domain.llm.entity.LlmPurpose
import blog.domain.llm.gateway.LlmChat
import blog.domain.llm.gateway.LlmGateway
import blog.domain.llm.repository.JdbcLlmCalls
import org.slf4j.LoggerFactory
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.dao.DataAccessException
import org.springframework.stereotype.Service
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
    private val llmSettings: LlmSettings,
    private val clock: Clock,
) {
    private val log = LoggerFactory.getLogger(javaClass)

    /** Throws what [stream] would refuse with before asking: no key, or the month's cap reached. */
    fun check() {
        if (!llmGateway.configured) throw BlogException(BlogError.LLM_UNAVAILABLE)
        // Calls checked at once may all go out, so a cap is passed by what those few cost.
        val spent = jdbcLlmCalls.spentSince(LlmCostPolicy.monthStart(clock.instant()), CAPPED)
        if (LlmCostPolicy.reached(spent, llmSettings.monthlyCapUsd)) {
            throw BlogException(BlogError.LLM_MONTHLY_CAP_REACHED)
        }
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
        val route = routeOf(request.purpose)
        val chat =
            LlmChat(
                model = route.model,
                thinking = route.thinking,
                system = request.system,
                user = request.user,
                maxTokens = request.maxTokens,
            )
        val reply = llmGateway.stream(chat, onText)
        val prices =
            LlmCostPolicy.Prices(
                inputPerMillion = route.inputPerMillionUsd,
                outputPerMillion = route.outputPerMillionUsd,
            )
        val call =
            LlmCall(
                purpose = LlmPurpose.valueOf(request.purpose.name),
                model = reply.model,
                inputTokens = reply.inputTokens,
                outputTokens = reply.outputTokens,
                costMicros = LlmCostPolicy.costMicros(reply.inputTokens, reply.outputTokens, prices),
                now = clock.instant(),
            )
        record(call)
        if (!reply.finished || reply.text.isBlank()) throw BlogException(BlogError.LLM_INCOMPLETE)
        return LlmResponse(
            text = reply.text,
            model = reply.model,
            inputTokens = reply.inputTokens,
            outputTokens = reply.outputTokens,
        )
    }

    // The model has billed this answer already, and losing it as well would help no one.
    private fun record(call: LlmCall) {
        try {
            jdbcLlmCalls.append(call)
        } catch (exception: DataAccessException) {
            log.error("A call's cost could not be recorded: {}", exception.javaClass.simpleName)
        }
    }

    private fun routeOf(purpose: LlmRequest.Purpose): LlmSettings.Route =
        when (purpose) {
            LlmRequest.Purpose.MEMO -> llmSettings.memo
            LlmRequest.Purpose.REVIEW -> llmSettings.review
        }

    private companion object {
        // Writing and reviewing share the cap; old rows for other purposes count toward neither.
        val CAPPED = listOf(LlmPurpose.MEMO, LlmPurpose.REVIEW)
    }
}
