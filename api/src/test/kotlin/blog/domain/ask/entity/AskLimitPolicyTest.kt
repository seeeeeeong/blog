package blog.domain.ask.entity

import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.Test
import java.time.Instant
import java.time.LocalDate

class AskLimitPolicyTest {
    private val key = "server-secret".toByteArray()
    private val day = LocalDate.of(2026, 10, 29)

    @Test
    fun `a reader's day starts at midnight in Korea`() {
        assertThat(AskLimitPolicy.dayOf(Instant.parse("2026-10-29T14:59:59Z"))).isEqualTo(LocalDate.of(2026, 10, 29))
        assertThat(AskLimitPolicy.dayOf(Instant.parse("2026-10-29T15:00:00Z"))).isEqualTo(LocalDate.of(2026, 10, 30))
    }

    @Test
    fun `an address hashes to the same 64 hex digits all day, and keeps nothing of itself`() {
        val hash = AskLimitPolicy.ipHash(key, "203.0.113.7", day)

        assertThat(hash).matches("[0-9a-f]{64}").doesNotContain("203")
        assertThat(AskLimitPolicy.ipHash(key, "203.0.113.7", day)).isEqualTo(hash)
    }

    @Test
    fun `another address, another day or another key hashes apart`() {
        val hash = AskLimitPolicy.ipHash(key, "203.0.113.7", day)

        assertThat(AskLimitPolicy.ipHash(key, "203.0.113.8", day)).isNotEqualTo(hash)
        assertThat(AskLimitPolicy.ipHash(key, "203.0.113.7", day.plusDays(1))).isNotEqualTo(hash)
        assertThat(AskLimitPolicy.ipHash("other".toByteArray(), "203.0.113.7", day)).isNotEqualTo(hash)
    }

    @Test
    fun `a hash needs a key`() {
        assertThatThrownBy { AskLimitPolicy.ipHash(ByteArray(0), "203.0.113.7", day) }
            .isInstanceOf(IllegalArgumentException::class.java)
    }
}
