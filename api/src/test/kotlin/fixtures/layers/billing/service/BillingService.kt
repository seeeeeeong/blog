package fixtures.layers.billing.service

import fixtures.layers.common.util.Ids
import fixtures.layers.shop.dto.response.OrderResponse
import fixtures.layers.shop.service.ShopService

/** Reads another feature through its service, and uses common code, both of which it may. */
class BillingService(
    val shopService: ShopService,
) {
    fun bill(): List<OrderResponse> = shopService.all().also { Ids.next() }
}
