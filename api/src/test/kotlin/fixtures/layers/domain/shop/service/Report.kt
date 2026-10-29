package fixtures.layers.domain.shop.service

import fixtures.layers.domain.shop.controller.ShopController

/** A service reaching up into a controller. */
class Report(
    val shopController: ShopController,
)
