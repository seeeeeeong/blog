package fixtures.layers.domain.billing.service

import fixtures.layers.domain.shop.repository.OrderRepository

/** Reads another feature's storage instead of asking its service. */
class Charge(
    val orderRepository: OrderRepository,
)
