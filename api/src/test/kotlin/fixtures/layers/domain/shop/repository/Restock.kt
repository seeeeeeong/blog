package fixtures.layers.domain.shop.repository

import fixtures.layers.domain.shop.service.ShopService

/** A repository reaching up into a service. */
class Restock(
    val shopService: ShopService,
)
