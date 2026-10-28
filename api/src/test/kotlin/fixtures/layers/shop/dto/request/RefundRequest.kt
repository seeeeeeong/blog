package fixtures.layers.shop.dto.request

import fixtures.layers.shop.service.ShopService

/** A request carrying a service instead of data. */
class RefundRequest(
    val shopService: ShopService,
)
