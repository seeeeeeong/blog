package fixtures.layers.domain.billing.entity

import fixtures.layers.domain.shop.entity.Order

/** Holds another feature's entity. */
class Payment(
    val order: Order,
)
