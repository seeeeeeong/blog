package blog.llm.entity

import java.math.BigDecimal
import java.math.RoundingMode
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId

/** What a call is estimated to cost, and the calendar month its cap is counted over. */
object LlmCostPolicy {
    /** USD per million tokens. */
    data class Prices(
        val inputPerMillion: BigDecimal,
        val outputPerMillion: BigDecimal,
    )

    // The owner's month: a cap starts over at midnight in Korea on the first.
    private val MONTH_ZONE: ZoneId = ZoneId.of("Asia/Seoul")
    private val MICROS_PER_USD = BigDecimal(1_000_000)

    /** In millionths of a dollar, rounded up, so the sum is never below the bill. */
    fun costMicros(
        inputTokens: Int,
        outputTokens: Int,
        prices: Prices,
    ): Long {
        require(inputTokens >= 0 && outputTokens >= 0) { "Token counts are never negative" }
        // A price per million tokens is the price per token in millionths.
        val micros =
            BigDecimal(inputTokens).multiply(prices.inputPerMillion) +
                BigDecimal(outputTokens).multiply(prices.outputPerMillion)
        return micros.setScale(0, RoundingMode.CEILING).longValueExact()
    }

    fun monthStart(now: Instant): Instant =
        LocalDate
            .ofInstant(now, MONTH_ZONE)
            .withDayOfMonth(1)
            .atStartOfDay(MONTH_ZONE)
            .toInstant()

    fun reached(
        spentMicros: Long,
        capUsd: BigDecimal,
    ): Boolean = BigDecimal(spentMicros) >= capUsd.multiply(MICROS_PER_USD)
}
