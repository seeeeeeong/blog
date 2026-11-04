package blog.domain.llm.service

import org.springframework.boot.context.properties.ConfigurationProperties
import java.math.BigDecimal

/** `blog.llm` in application.yml: the monthly caps in US dollars, and the model each use asks. */
@ConfigurationProperties("blog.llm")
data class LlmSettings(
    val monthlyCapUsd: BigDecimal,
    val askMonthlyCapUsd: BigDecimal,
    val memo: Route,
    val ask: Route,
) {
    /** A model and its prices, in USD per million tokens. */
    data class Route(
        val model: String,
        val inputPerMillionUsd: BigDecimal,
        val outputPerMillionUsd: BigDecimal,
    )
}
