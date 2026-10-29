package fixtures.layers.billing.service

import fixtures.layers.shop.gateway.PriceGateway

/** Calls another feature's gateway instead of asking its service. */
class Quote(
    val priceGateway: PriceGateway,
)
