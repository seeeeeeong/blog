package fixtures.layers.domain.shop.service

import fixtures.layers.domain.shop.gateway.PriceGateway

/** A service calling its own feature's gateway, as it should. */
class Pricing(
    val priceGateway: PriceGateway,
)
