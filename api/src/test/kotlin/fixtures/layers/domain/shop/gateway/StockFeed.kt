package fixtures.layers.domain.shop.gateway

import fixtures.layers.domain.shop.repository.OrderRepository

/** A gateway reaching into storage instead of only talking to its system. */
class StockFeed(
    val orderRepository: OrderRepository,
)
