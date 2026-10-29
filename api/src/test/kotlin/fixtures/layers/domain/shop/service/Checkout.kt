package fixtures.layers.domain.shop.service

import fixtures.layers.domain.shop.security.ShopGuard

/** A service reaching back out into the web's security handlers. */
class Checkout(
    val shopGuard: ShopGuard,
)
