package fixtures.layers.shop.gateway

/** An external system, which only the service calls. */
interface PriceGateway {
    fun price(sku: String): Long
}
