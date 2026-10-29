package fixtures.layers.shop.service

import fixtures.layers.shop.security.ShopGuard

/** A service reaching back out into the web's security handlers. */
class Checkout(
    val shopGuard: ShopGuard,
)
