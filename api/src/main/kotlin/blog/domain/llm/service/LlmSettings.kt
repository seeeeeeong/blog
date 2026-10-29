package blog.domain.llm.service

import org.springframework.boot.context.properties.ConfigurationProperties
import java.math.BigDecimal

/** `blog.llm` in application.yml: the monthly caps in US dollars, and the model's prices. */
@ConfigurationProperties("blog.llm")
data class LlmSettings(
    val monthlyCapUsd: BigDecimal,
    val askMonthlyCapUsd: BigDecimal,
    val price: Price,
) {
    /** USD per million tokens. */
    data class Price(
        val inputPerMillionUsd: BigDecimal,
        val outputPerMillionUsd: BigDecimal,
    )
}
