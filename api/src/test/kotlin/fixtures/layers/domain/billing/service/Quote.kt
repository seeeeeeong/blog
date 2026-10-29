package fixtures.layers.domain.billing.service

import fixtures.layers.domain.shop.gateway.PriceGateway

/** Calls another feature's gateway instead of asking its service. */
class Quote(
    val priceGateway: PriceGateway,
)
