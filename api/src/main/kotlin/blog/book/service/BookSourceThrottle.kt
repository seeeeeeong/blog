package blog.book.service

import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import java.time.Clock
import java.time.Duration
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId

/**
 * How often YES24 may be asked on the owner's key: less than it allows a second and a day. Counted
 * in memory under one lock, since one instance runs; a restart that forgets the day's count is caught
 * by YES24's own refusal.
 */
@Component
class BookSourceThrottle(
    @Value("\${blog.book-source.per-second}") private val perSecond: Int,
    @Value("\${blog.book-source.per-day}") private val perDay: Int,
    private val clock: Clock,
) {
    private val lock = Any()
    private val lastSecond = ArrayDeque<Instant>()
    private var day: LocalDate? = null
    private var askedToday = 0

    /** Whether one more call may go out now; an allowed one is counted, a refused one is not. */
    fun ask(): Boolean =
        synchronized(lock) {
            val now = clock.instant()
            while (lastSecond.isNotEmpty() && !lastSecond.first().isAfter(now.minus(SECOND))) lastSecond.removeFirst()
            val today = LocalDate.ofInstant(now, SOURCE_ZONE)
            if (today != day) {
                day = today
                askedToday = 0
            }
            val allowed = lastSecond.size < perSecond && askedToday < perDay
            if (allowed) {
                lastSecond.addLast(now)
                askedToday++
            }
            allowed
        }

    private companion object {
        val SECOND: Duration = Duration.ofSeconds(1)

        // YES24 starts a key's day over at midnight in Korea.
        val SOURCE_ZONE: ZoneId = ZoneId.of("Asia/Seoul")
    }
}
