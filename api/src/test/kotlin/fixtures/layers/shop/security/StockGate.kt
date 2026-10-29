package fixtures.layers.shop.security

import fixtures.layers.shop.repository.OrderRepository

/** A security handler skipping the service to read storage. */
class StockGate(
    val orderRepository: OrderRepository,
)
