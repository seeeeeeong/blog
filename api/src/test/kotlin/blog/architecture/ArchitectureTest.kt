package blog.architecture

import com.tngtech.archunit.core.importer.ClassFileImporter
import com.tngtech.archunit.core.importer.ImportOption
import com.tngtech.archunit.lang.ArchRule
import org.junit.jupiter.api.Test

class ArchitectureTest {
    private val production =
        ClassFileImporter()
            .withImportOption(ImportOption.DoNotIncludeTests())
            .importPackages("blog")

    // A rule holds from the first class it matches; until a module brings one, it matches none.
    private fun ArchRule.checkProduction() = allowEmptyShould(true).check(production)

    @Test
    fun `rule classes depend on no framework`() {
        Rules.pure().checkProduction()
    }

    @Test
    fun `layers depend inward, controller to service to repository to entity`() {
        Rules.layers("blog").checkProduction()
    }

    @Test
    fun `every class of a feature sits in one of its layers`() {
        Rules.featureLayout("blog").checkProduction()
    }

    @Test
    fun `a feature reaches another only through its service`() {
        Rules.featuresKeepApart("blog").checkProduction()
    }

    @Test
    fun `an entity holds no web, JDBC or session code`() {
        Rules.entityFrameworks("blog").checkProduction()
    }
}
