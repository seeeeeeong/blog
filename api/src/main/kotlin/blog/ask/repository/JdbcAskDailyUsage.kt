package blog.ask.repository

import org.springframework.jdbc.core.simple.JdbcClient
import org.springframework.stereotype.Repository
import java.time.LocalDate

/**
 * Each reader's questions today. JdbcClient rather than JPA: a count taken by many readers at once
 * must be one atomic upsert, which neither reads it first nor lets two requests both take the last
 * question.
 */
@Repository
class JdbcAskDailyUsage(
    private val jdbcClient: JdbcClient,
) {
    /** Counts a question for [ipHash] on [day] unless it already has [limit]; false when it has. */
    fun take(
        ipHash: String,
        day: LocalDate,
        limit: Int,
    ): Boolean {
        // Days before today are of no more use, and a reader's hash is gone with them.
        jdbcClient
            .sql("delete from ask_daily_usage where day < :day")
            .param("day", day)
            .update()
        val taken =
            jdbcClient
                .sql(
                    """
                    insert into ask_daily_usage (ip_hash, day, count)
                    values (:ipHash, :day, 1)
                    on conflict (ip_hash, day) do update set count = ask_daily_usage.count + 1
                    where ask_daily_usage.count < :limit
                    """.trimIndent(),
                ).param("ipHash", ipHash)
                .param("day", day)
                .param("limit", limit)
                .update()
        return taken == 1
    }
}
