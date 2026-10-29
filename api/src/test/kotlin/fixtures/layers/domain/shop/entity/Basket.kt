package fixtures.layers.domain.shop.entity

import fixtures.layers.common.security.Session

/** An entity holding the signed-in session, a project type but not one an entity may use. */
class Basket(
    val session: Session,
)
