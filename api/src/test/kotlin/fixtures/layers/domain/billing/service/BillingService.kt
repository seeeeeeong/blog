package fixtures.layers.domain.billing.service

import fixtures.layers.common.util.Ids
import fixtures.layers.domain.shop.dto.response.OrderResponse
import fixtures.layers.domain.shop.service.ShopService

/** Reads another feature through its service, and uses common code, both of which it may. */
class BillingService(
    val shopService: ShopService,
) {
    fun bill(): List<OrderResponse> = shopService.all().also { Ids.next() }
}
