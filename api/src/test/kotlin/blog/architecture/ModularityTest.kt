package blog.architecture

import blog.BlogApplication
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.modulith.core.ApplicationModules
import org.springframework.modulith.docs.Documenter

class ModularityTest {
    private val modules = ApplicationModules.of(BlogApplication::class.java)

    @Test
    fun `modules keep to their declared boundaries`() {
        modules.verify()
    }

    @Test
    fun `every package under blog is a declared module`() {
        assertThat(Modularity.undeclaredModulePackages(BlogApplication::class.java, modules)).isEmpty()
    }

    @Test
    fun `the modules are the ones declared`() {
        assertThat(modules.map { it.identifier.toString() }).containsExactlyInAnyOrder("common")
    }

    @Test
    fun `the module diagrams are written for reading`() {
        Documenter(modules).writeDocumentation()
    }
}
