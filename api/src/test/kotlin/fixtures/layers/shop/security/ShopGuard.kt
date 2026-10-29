package fixtures.layers.shop.security

import fixtures.layers.shop.dto.response.OrderResponse
import fixtures.layers.shop.service.ShopService

/** A security handler going through the service, as it should. */
class ShopGuard(
    val shopService: ShopService,
) {
    fun orders(): List<OrderResponse> = shopService.all()
}
