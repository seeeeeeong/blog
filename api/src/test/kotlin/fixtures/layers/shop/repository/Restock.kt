package fixtures.layers.shop.repository

import fixtures.layers.shop.service.ShopService

/** A repository reaching up into a service. */
class Restock(
    val shopService: ShopService,
)
