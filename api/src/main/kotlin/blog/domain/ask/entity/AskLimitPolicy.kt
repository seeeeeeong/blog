package blog.domain.ask.entity

import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.util.HexFormat
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

/**
 * How many questions a reader may ask a day, and how they are told apart without keeping their
 * address: a keyed hash of the address and the day, so a day's count cannot be traced to an
 * address, nor linked to the same reader's count on another day.
 */
object AskLimitPolicy {
    // Enough for a curious reader on a long evening; at a cent or so a question, one address costs
    // under a dollar a day.
    const val DAILY_QUESTIONS = 50

    // Readers' days start over at midnight in Korea, as the owner's month does.
    private val DAY_ZONE: ZoneId = ZoneId.of("Asia/Seoul")
    private const val ALGORITHM = "HmacSHA256"

    fun dayOf(now: Instant): LocalDate = LocalDate.ofInstant(now, DAY_ZONE)

    /** 64 lowercase hex digits. */
    fun ipHash(
        key: ByteArray,
        address: String,
        day: LocalDate,
    ): String {
        require(key.isNotEmpty()) { "A hash needs a key" }
        val mac = Mac.getInstance(ALGORITHM).apply { init(SecretKeySpec(key, ALGORITHM)) }
        return HexFormat.of().formatHex(mac.doFinal("$day|$address".toByteArray(Charsets.UTF_8)))
    }
}
