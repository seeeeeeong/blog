package fixtures.layers.shop.controller

import fixtures.layers.shop.gateway.PriceGateway

/** A controller calling an external system itself, skipping the service. */
class PriceView(
    val priceGateway: PriceGateway,
)
