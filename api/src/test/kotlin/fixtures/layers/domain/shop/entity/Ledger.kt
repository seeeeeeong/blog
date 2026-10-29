package fixtures.layers.domain.shop.entity

import org.springframework.jdbc.core.simple.JdbcClient

/** An entity writing SQL itself. */
class Ledger(
    val jdbcClient: JdbcClient,
)
