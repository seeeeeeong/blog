package fixtures.layers.shop.dto.response

import fixtures.layers.shop.entity.Order

/** Built from an entity, which a dto may read. */
data class OrderResponse(
    val id: Long,
) {
    companion object {
        fun from(order: Order) = OrderResponse(order.id)
    }
}
