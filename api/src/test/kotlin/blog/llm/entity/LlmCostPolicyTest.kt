package blog.llm.entity

import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.Test
import java.math.BigDecimal
import java.time.Instant

class LlmCostPolicyTest {
    private val prices = LlmCostPolicy.Prices(BigDecimal("0.30"), BigDecimal("1.20"))

    @Test
    fun `a call costs its tokens at the price per million, in millionths of a dollar`() {
        assertThat(LlmCostPolicy.costMicros(1_000_000, 0, prices)).isEqualTo(300_000)
        assertThat(LlmCostPolicy.costMicros(0, 1_000_000, prices)).isEqualTo(1_200_000)
        assertThat(LlmCostPolicy.costMicros(1_000, 2_000, prices)).isEqualTo(2_700)
        assertThat(LlmCostPolicy.costMicros(0, 0, prices)).isZero()
    }

    @Test
    fun `a fraction of a millionth rounds up, so the estimate is never below the bill`() {
        assertThat(LlmCostPolicy.costMicros(1, 0, prices)).isEqualTo(1)
        assertThat(LlmCostPolicy.costMicros(3, 1, prices)).isEqualTo(3)
    }

    @Test
    fun `token counts are never negative`() {
        assertThatThrownBy {
            LlmCostPolicy.costMicros(
                -1,
                0,
                prices,
            )
        }.isInstanceOf(IllegalArgumentException::class.java)
    }

    @Test
    fun `a month starts at midnight on the first in Korea`() {
        assertThat(LlmCostPolicy.monthStart(Instant.parse("2026-10-31T14:59:59Z")))
            .isEqualTo(Instant.parse("2026-09-30T15:00:00Z"))
        assertThat(LlmCostPolicy.monthStart(Instant.parse("2026-10-31T15:00:00Z")))
            .isEqualTo(Instant.parse("2026-10-31T15:00:00Z"))
    }

    @Test
    fun `the cap is reached at its amount, not a millionth before`() {
        val cap = BigDecimal("10")

        assertThat(LlmCostPolicy.reached(9_999_999, cap)).isFalse()
        assertThat(LlmCostPolicy.reached(10_000_000, cap)).isTrue()
        assertThat(LlmCostPolicy.reached(12_000_000, cap)).isTrue()
    }
}
