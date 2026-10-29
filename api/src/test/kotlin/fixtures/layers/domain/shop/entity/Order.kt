package fixtures.layers.domain.shop.entity

import fixtures.layers.common.util.Ids
import jakarta.persistence.Entity
import jakarta.persistence.Id

/** Uses the shared id maker and its own feature's status, which an entity may. */
@Entity
class Order(
    @Id val id: Long = Ids.next(),
    val status: OrderStatus = OrderStatus.OPEN,
)

enum class OrderStatus { OPEN, PAID }
