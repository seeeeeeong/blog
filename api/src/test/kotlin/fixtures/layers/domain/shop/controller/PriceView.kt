package fixtures.layers.domain.shop.controller

import fixtures.layers.domain.shop.gateway.PriceGateway

/** A controller calling an external system itself, skipping the service. */
class PriceView(
    val priceGateway: PriceGateway,
)
