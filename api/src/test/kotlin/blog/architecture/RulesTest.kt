package blog.architecture

import com.tngtech.archunit.core.importer.ClassFileImporter
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

class RulesTest {
    private fun fixtures(pkg: String) = ClassFileImporter().importPackages(pkg)

    // "Method <fixtures.framework.LeakyPolicy.close()> calls ..." names the offender first.
    private val offender = Regex("^\\w+ <fixtures\\.framework\\.(\\w+)")

    @Test
    fun `the purity rule catches a rule or value class reaching past the JDK, directly or not, and only those`() {
        val result = Rules.pure().evaluate(fixtures("fixtures.framework"))

        val offenders =
            result.failureReport.details
                .mapNotNull { offender.find(it)?.groupValues?.get(1) }
                .toSet()
        assertThat(offenders)
            .containsExactlyInAnyOrder(
                "LeakyPolicy",
                "FlywayPolicy",
                "IndirectPolicy",
                "ForeignDecisionPolicy",
                "LoggingPolicy",
                "EnvironmentPolicy",
                "ConsolePolicy",
                "Container",
                "LeakyValue",
            )
    }

    // "Field <fixtures.layers.domain.shop.entity.Invoice.shopService> has type ..." names the offender first.
    private val layerOffender = Regex("^\\w+ <fixtures\\.layers\\.domain\\.([a-z]+\\.[a-z.]+\\.[A-Z]\\w*)")

    private fun offendersOf(report: List<String>) =
        report
            .mapNotNull {
                layerOffender.find(it)?.groupValues?.get(1)
            }.toSet()

    private val layered = fixtures("fixtures.layers")

    @Test
    fun `the top level rule catches a class outside common and domain, and only that one`() {
        val result = Rules.topLevel("fixtures.layers").evaluate(layered)

        assertThat(result.failureReport.details).singleElement().asString().contains("<fixtures.layers.util.Slugs>")
    }

    @Test
    fun `the layer rule catches each reach outward or past a layer, and only those`() {
        val result = Rules.layers("fixtures.layers").evaluate(layered)

        assertThat(offendersOf(result.failureReport.details))
            .containsExactlyInAnyOrder(
                "shop.entity.Invoice",
                "shop.service.Report",
                "shop.repository.Restock",
                "shop.controller.OrderView",
                "shop.controller.OrderPage",
                "shop.dto.request.RefundRequest",
                "shop.security.StockGate",
                "shop.service.Checkout",
                "shop.controller.PriceView",
                "shop.gateway.StockFeed",
            )
    }

    @Test
    fun `the layout rule catches a class of a feature outside its layers, and only that one`() {
        val result = Rules.featureLayout("fixtures.layers").evaluate(layered)

        assertThat(offendersOf(result.failureReport.details)).containsExactly("shop.support.Discount")
    }

    @Test
    fun `the feature rule catches a reach into another feature's repository, entity or gateway, and only those`() {
        val result = Rules.featuresKeepApart("fixtures.layers").evaluate(layered)

        assertThat(offendersOf(result.failureReport.details))
            .containsExactlyInAnyOrder("billing.service.Charge", "billing.entity.Payment", "billing.service.Quote")
    }

    @Test
    fun `the entity dependency rule catches an entity holding SQL, a session or a service, and only those`() {
        val result = Rules.entityFrameworks("fixtures.layers").evaluate(layered)

        assertThat(offendersOf(result.failureReport.details))
            .containsExactlyInAnyOrder("shop.entity.Ledger", "shop.entity.Basket", "shop.entity.Invoice")
    }
}
