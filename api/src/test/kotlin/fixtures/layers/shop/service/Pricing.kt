package fixtures.layers.shop.service

import fixtures.layers.shop.gateway.PriceGateway

/** A service calling its own feature's gateway, as it should. */
class Pricing(
    val priceGateway: PriceGateway,
)
