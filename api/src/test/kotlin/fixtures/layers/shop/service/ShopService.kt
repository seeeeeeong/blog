package fixtures.layers.shop.service

import fixtures.layers.shop.dto.response.OrderResponse
import fixtures.layers.shop.repository.OrderRepository

class ShopService(
    val orderRepository: OrderRepository,
) {
    fun all(): List<OrderResponse> = orderRepository.all().map(OrderResponse::from)
}
