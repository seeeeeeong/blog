package fixtures.layers.domain.shop.entity

import fixtures.layers.domain.shop.service.ShopService

/** An entity calling a service. */
class Invoice(
    val shopService: ShopService,
)
