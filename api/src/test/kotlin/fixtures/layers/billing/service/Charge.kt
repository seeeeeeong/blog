package fixtures.layers.billing.service

import fixtures.layers.shop.repository.OrderRepository

/** Reads another feature's storage instead of asking its service. */
class Charge(
    val orderRepository: OrderRepository,
)
