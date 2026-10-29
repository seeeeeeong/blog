package fixtures.layers.domain.shop.security

import fixtures.layers.domain.shop.repository.OrderRepository

/** A security handler skipping the service to read storage. */
class StockGate(
    val orderRepository: OrderRepository,
)
