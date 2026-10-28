package fixtures.layers.shop.controller

import fixtures.layers.shop.dto.response.OrderResponse
import fixtures.layers.shop.service.ShopService

class ShopController(
    val shopService: ShopService,
) {
    fun orders(): List<OrderResponse> = shopService.all()
}
