package fixtures.layers.shop.entity

import fixtures.layers.shop.service.ShopService

/** An entity calling a service. */
class Invoice(
    val shopService: ShopService,
)
