package fixtures.layers.shop.service

import fixtures.layers.shop.controller.ShopController

/** A service reaching up into a controller. */
class Report(
    val shopController: ShopController,
)
