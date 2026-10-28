package fixtures.layers.shop.controller

import fixtures.layers.shop.repository.OrderRepository

/** A controller skipping the service to read storage. */
class OrderView(
    val orderRepository: OrderRepository,
)
