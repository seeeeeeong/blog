package fixtures.layers.domain.shop.dto.request

import fixtures.layers.domain.shop.service.ShopService

/** A request carrying a service instead of data. */
class RefundRequest(
    val shopService: ShopService,
)
