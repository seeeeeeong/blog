package fixtures.layers.domain.shop.controller

import fixtures.layers.domain.shop.repository.OrderRepository

/** A controller skipping the service to read storage. */
class OrderView(
    val orderRepository: OrderRepository,
)
