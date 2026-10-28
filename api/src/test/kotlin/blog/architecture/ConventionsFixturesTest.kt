package blog.architecture

import com.lemonappdev.konsist.api.Konsist
import org.assertj.core.api.Assertions.assertThatCode
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.Test

class ConventionsFixturesTest {
    private fun scope(dir: String) = Konsist.scopeFromDirectory("api/src/test/resources/konsist/$dir")

    @Test
    fun `a test named after no production file is caught, and only that one`() {
        assertThatThrownBy {
            Conventions.testsMirrorProduction(tests = scope("mirror/test"), production = scope("mirror/main"))
        }.hasMessageContaining("OrphanTest")
            .message()
            .doesNotContain("ChatServiceTest")
    }

    @Test
    fun `a schema test mirrors a migration, and one named after no migration is caught`() {
        assertThatThrownBy {
            Conventions.testsMirrorProduction(
                tests = scope("schema/test"),
                production = scope("mirror/main"),
                migrations = setOf("V1__posts.sql", "V2__review_log.sql"),
            )
        }.hasMessageContaining("OrphanSchemaTest")
            .message()
            .doesNotContain("PostsSchemaTest")
            .doesNotContain("ReviewLogSchemaTest")
    }

    @Test
    fun `a migration without a schema test is caught, and only that one`() {
        assertThatThrownBy {
            Conventions.migrationsHaveSchemaTests(
                tests = scope("schema/test"),
                migrations = setOf("V1__posts.sql", "V2__review_log.sql", "V3__topics.sql"),
            )
        }.hasMessageContaining("V3__topics.sql")
            .message()
            .doesNotContain("V1__posts.sql")
            .doesNotContain("V2__review_log.sql")
    }

    @Test
    fun `no migrations need no schema tests`() {
        assertThatCode {
            Conventions.migrationsHaveSchemaTests(tests = scope("schema/test"), migrations = emptySet())
        }.doesNotThrowAnyException()
    }

    @Test
    fun `a type in a file of its own, with nested types and functions, passes`() {
        assertThatCode { Conventions.filesHoldOneType(scope("onetype/split")) }.doesNotThrowAnyException()
    }

    @Test
    fun `a second top-level type is caught, even a closely related one`() {
        assertThatThrownBy { Conventions.filesHoldOneType(scope("onetype/related")) }
            .hasMessageContaining("SpendPolicy")
    }

    @Test
    fun `a type sitting above the one the file is named for is caught`() {
        assertThatThrownBy { Conventions.filesHoldOneType(scope("onetype/grouped")) }
            .hasMessageContaining("BudgetService")
    }

    @Test
    fun `a file named after no type it holds is caught`() {
        assertThatThrownBy { Conventions.filesHoldOneType(scope("onetype/misnamed")) }
            .hasMessageContaining("Budget")
    }

    @Test
    fun `a controller returning a ResponseEntity is caught`() {
        assertThatThrownBy { Conventions.controllersReturnResponses(scope("returns/bad")) }
            .hasMessageContaining("orders")
            .hasMessageContaining("account")
            .hasMessageContaining("total")
    }

    @Test
    fun `a controller returning a response type or nothing passes`() {
        assertThatCode { Conventions.controllersReturnResponses(scope("returns/good")) }.doesNotThrowAnyException()
    }

    @Test
    fun `a controller outside a controller package, and a non-controller inside one, are caught`() {
        assertThatThrownBy { Conventions.controllersInControllerPackages(scope("placement/bad")) }
            .hasMessageContaining("RefundController")
            .hasMessageContaining("PriceFormatter")
            .message()
            .doesNotContain("ShopController")
    }

    @Test
    fun `controllers in a controller package pass`() {
        assertThatCode {
            Conventions.controllersInControllerPackages(
                scope("placement/good"),
            )
        }.doesNotThrowAnyException()
    }

    @Test
    fun `a dependency named other than its type is caught`() {
        assertThatThrownBy { Conventions.dependenciesNamedAfterTypes(scope("names/bad")) }
            .hasMessageContaining("orders")
            .hasMessageContaining("payments")
            .hasMessageContaining("lazyOrders")
            .hasMessageContaining("ordersStore")
    }

    @Test
    fun `dependencies named after their types, and plain values, pass`() {
        assertThatCode { Conventions.dependenciesNamedAfterTypes(scope("names/good")) }.doesNotThrowAnyException()
    }
}
