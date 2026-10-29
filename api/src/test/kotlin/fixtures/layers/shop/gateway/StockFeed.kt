package fixtures.layers.shop.gateway

import fixtures.layers.shop.repository.OrderRepository

/** A gateway reaching into storage instead of only talking to its system. */
class StockFeed(
    val orderRepository: OrderRepository,
)
