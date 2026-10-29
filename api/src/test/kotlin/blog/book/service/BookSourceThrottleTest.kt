package blog.book.service

import blog.MutableClock
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import java.time.Duration
import java.time.Instant

class BookSourceThrottleTest {
    private val clock = MutableClock(Instant.parse("2026-10-04T00:00:00Z"))

    @Test
    fun `calls past the pace of a second wait for the next one`() {
        val throttle = BookSourceThrottle(perSecond = 2, perDay = 100, clock = clock)

        val inOneSecond = List(3) { throttle.ask() }
        clock.advance(Duration.ofSeconds(1))

        assertThat(inOneSecond).containsExactly(true, true, false)
        assertThat(throttle.ask()).isTrue()
    }

    @Test
    fun `the day's allowance starts over at midnight in Korea, not in UTC`() {
        // 14:59 UTC is 23:59 in Seoul.
        clock.set(Instant.parse("2026-10-04T14:59:00Z"))
        val throttle = BookSourceThrottle(perSecond = 10, perDay = 2, clock = clock)
        throttle.ask()
        throttle.ask()

        val spent = throttle.ask()
        clock.advance(Duration.ofMinutes(1))

        assertThat(spent).isFalse()
        assertThat(throttle.ask()).isTrue()
    }
}
