package fixtures.layers.domain.shop.service

import fixtures.layers.domain.shop.dto.response.OrderResponse
import fixtures.layers.domain.shop.repository.OrderRepository

class ShopService(
    val orderRepository: OrderRepository,
) {
    fun all(): List<OrderResponse> = orderRepository.all().map(OrderResponse::from)
}
