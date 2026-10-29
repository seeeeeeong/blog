package fixtures.layers.domain.shop.security

import fixtures.layers.domain.shop.dto.response.OrderResponse
import fixtures.layers.domain.shop.service.ShopService

/** A security handler going through the service, as it should. */
class ShopGuard(
    val shopService: ShopService,
) {
    fun orders(): List<OrderResponse> = shopService.all()
}
