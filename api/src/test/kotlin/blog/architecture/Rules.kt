package blog.architecture

import com.tngtech.archunit.base.DescribedPredicate
import com.tngtech.archunit.core.domain.JavaClass
import com.tngtech.archunit.core.domain.JavaClass.Predicates.resideInAnyPackage
import com.tngtech.archunit.lang.ArchCondition
import com.tngtech.archunit.lang.ArchRule
import com.tngtech.archunit.lang.ConditionEvents
import com.tngtech.archunit.lang.SimpleConditionEvent
import com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes
import com.tngtech.archunit.library.Architectures.layeredArchitecture

internal object Rules {
    // An allow list, not a deny list: a library nobody thought to name, or a project type
    // that holds a connection, is caught as well.
    private val PURE =
        arrayOf(
            "java.lang..",
            // java.util itself and its pure subpackages; not logging, prefs, jar or zip.
            "java.util",
            "java.util.function..",
            "java.util.stream..",
            "java.util.regex..",
            "java.time..",
            "java.text..",
            "java.math..",
            "java.nio.charset..",
            "java.security..",
            "javax.crypto..",
            "kotlin..",
            "org.jetbrains.annotations..",
        )

    private val RULE_NAME = Regex("\\w+(Policy|Decision|Parser|Prompt|Check)")

    // Inside the packages above, but with side effects: the environment, processes, threads,
    // reflection, standard output.
    private val IMPURE =
        arrayOf("java.lang.reflect..", "kotlin.io..", "kotlin.system..", "kotlin.concurrent..")
    private val IMPURE_TYPES =
        setOf(
            "java.lang.System",
            "java.lang.Runtime",
            "java.lang.ProcessBuilder",
            "java.lang.Process",
            "java.lang.Thread",
            "java.lang.ClassLoader",
        )

    // Only our own classes count: a framework type may end in Decision too.
    private val OWN = arrayOf("blog..", "fixtures..")

    // A value class's companion holds its factory, so it counts as the value class.
    private fun isValueClass(type: JavaClass): Boolean =
        type.isAnnotatedWith(JvmInline::class.java) || type.enclosingClass.map(::isValueClass).orElse(false)

    // A nested class is Outer$AccessPolicy on the JVM; its own name decides. A value class
    // holds a rule too.
    private fun isRule(type: JavaClass) =
        resideInAnyPackage(*OWN).test(type) &&
            (
                isValueClass(type) ||
                    type.name
                        .substringAfterLast('.')
                        .split('$')
                        .any { RULE_NAME.matches(it) }
            )

    private val ruleClasses =
        DescribedPredicate.describe<JavaClass>(
            "named as a rule (Policy, Decision, Parser, Prompt, Check) or a value class",
        ) {
            isRule(it)
        }

    // An array counts as its element type: an enum's values() returns one.
    private val allowed =
        DescribedPredicate.describe<JavaClass>("in the JDK's pure packages, Kotlin, or another rule class") {
            val type = if (it.isArray) it.baseComponentType else it
            type.isPrimitive || isRule(type) || isPure(type)
        }

    private const val COMMON = "common"
    private const val DOMAIN = "domain"
    private const val CONTROLLER = "controller"
    private const val SECURITY = "security"
    private const val SERVICE = "service"
    private const val DTO = "dto"
    private const val REPOSITORY = "repository"
    private const val ENTITY = "entity"
    private const val GATEWAY = "gateway"
    private val LAYERS = listOf(CONTROLLER, SECURITY, SERVICE, DTO, REPOSITORY, ENTITY, GATEWAY)

    // What a feature keeps to itself; another feature asks its service.
    private val OWN_LAYERS = setOf(REPOSITORY, ENTITY, GATEWAY)

    // An entity may carry its mapping and nothing that talks HTTP or SQL.
    private val ENTITY_FRAMEWORKS =
        arrayOf(
            "jakarta.persistence..",
            "org.hibernate.annotations..",
            "org.springframework.data..",
        )

    private fun isPure(type: JavaClass) =
        resideInAnyPackage(*PURE).test(type) && !resideInAnyPackage(*IMPURE).test(type) && type.name !in IMPURE_TYPES

    /** `blog.domain.post.service` → (`post`, `service`); common code and the root belong to no feature. */
    private fun placeOf(
        root: String,
        packageName: String,
    ): Pair<String, String?>? {
        val features = "$root.$DOMAIN."
        if (!packageName.startsWith(features)) return null
        val segments = packageName.removePrefix(features).split('.')
        return segments.first() to segments.getOrNull(1)
    }

    private fun inCommon(
        root: String,
        packageName: String,
    ) = packageName == "$root.$COMMON" || packageName.startsWith("$root.$COMMON.")

    private fun inFeature(root: String) =
        DescribedPredicate.describe<JavaClass>("in a feature under $root") { placeOf(root, it.packageName) != null }

    private fun inLayer(
        root: String,
        layer: String,
    ) = DescribedPredicate.describe<JavaClass>(
        "in a feature's $layer",
    ) { placeOf(root, it.packageName)?.second == layer }

    /**
     * controller → service → repository → entity in every feature under [root], with dto between
     * controller and service and reading only entities. security (filters, handlers) sits beside
     * controller: the web's other door into the service. gateway (an external system's client) is
     * called by the service alone and reaches into no layer.
     */
    fun layers(root: String): ArchRule =
        layeredArchitecture()
            .consideringOnlyDependenciesInLayers()
            // A feature brings the layers it needs; a layer no feature has yet is not a violation.
            .withOptionalLayers(true)
            .layer(CONTROLLER)
            .definedBy(inLayer(root, CONTROLLER))
            .layer(SECURITY)
            .definedBy(inLayer(root, SECURITY))
            .layer(SERVICE)
            .definedBy(inLayer(root, SERVICE))
            .layer(DTO)
            .definedBy(inLayer(root, DTO))
            .layer(REPOSITORY)
            .definedBy(inLayer(root, REPOSITORY))
            .layer(ENTITY)
            .definedBy(inLayer(root, ENTITY))
            .layer(GATEWAY)
            .definedBy(inLayer(root, GATEWAY))
            .whereLayer(CONTROLLER)
            .mayNotBeAccessedByAnyLayer()
            .whereLayer(SECURITY)
            .mayNotBeAccessedByAnyLayer()
            .whereLayer(SERVICE)
            .mayOnlyBeAccessedByLayers(CONTROLLER, SECURITY)
            .whereLayer(DTO)
            .mayOnlyBeAccessedByLayers(CONTROLLER, SECURITY, SERVICE)
            .whereLayer(REPOSITORY)
            .mayOnlyBeAccessedByLayers(SERVICE)
            .whereLayer(ENTITY)
            .mayOnlyBeAccessedByLayers(SERVICE, DTO, REPOSITORY)
            .whereLayer(GATEWAY)
            .mayOnlyBeAccessedByLayers(SERVICE)

    /** Under [root], a class is the application itself, common code, or a feature's under domain. */
    fun topLevel(root: String): ArchRule =
        classes()
            .that()
            .resideInAPackage("$root..")
            .should(
                object : ArchCondition<JavaClass>("sit in $COMMON or a feature under $DOMAIN") {
                    override fun check(
                        item: JavaClass,
                        events: ConditionEvents,
                    ) {
                        val placed =
                            item.packageName == root || inCommon(root, item.packageName) ||
                                placeOf(root, item.packageName) != null
                        if (!placed) {
                            events.add(
                                SimpleConditionEvent.violated(
                                    item,
                                    "Class <${item.name}> sits outside $COMMON and $DOMAIN",
                                ),
                            )
                        }
                    }
                },
            )

    /** Every class of a feature sits in one of its layers, where the rules above see it. */
    fun featureLayout(root: String): ArchRule =
        classes()
            .that(inFeature(root))
            .should(
                object : ArchCondition<JavaClass>("sit in one of ${LAYERS.joinToString()}") {
                    override fun check(
                        item: JavaClass,
                        events: ConditionEvents,
                    ) {
                        if (placeOf(root, item.packageName)?.second !in LAYERS) {
                            events.add(SimpleConditionEvent.violated(item, "Class <${item.name}> sits in no layer"))
                        }
                    }
                },
            )

    /** A feature uses another's repository or entity only through that feature's service. */
    fun featuresKeepApart(root: String): ArchRule =
        classes()
            .that(inFeature(root))
            .should(
                object : ArchCondition<JavaClass>(
                    "use another feature's repository or entity only through its service",
                ) {
                    override fun check(
                        item: JavaClass,
                        events: ConditionEvents,
                    ) {
                        val own = placeOf(root, item.packageName)?.first
                        item.directDependenciesFromSelf
                            .filter { dependency ->
                                val target = dependency.targetClass.let { if (it.isArray) it.baseComponentType else it }
                                val place = placeOf(root, target.packageName)
                                place != null && place.first != own && place.second in OWN_LAYERS
                            }.forEach { events.add(SimpleConditionEvent.violated(it, it.description)) }
                    }
                },
            )

    fun entityFrameworks(root: String): ArchRule =
        classes()
            .that(inLayer(root, ENTITY))
            .should()
            .onlyDependOnClassesThat(
                DescribedPredicate.describe(
                    "in the pure JDK, Kotlin, JPA, Spring Data, an entity, or common entity and util",
                ) {
                    val type = if (it.isArray) it.baseComponentType else it
                    type.isPrimitive ||
                        isPure(type) ||
                        resideInAnyPackage(*ENTITY_FRAMEWORKS).test(type) ||
                        inLayer(root, ENTITY).test(type) ||
                        resideInAnyPackage("$root.$COMMON.entity..", "$root.$COMMON.util..").test(type)
                },
            ).because("an entity holds the rules; HTTP, SQL and sessions belong to the layers around it")

    fun pure(): ArchRule =
        classes()
            .that(ruleClasses)
            .should()
            .onlyDependOnClassesThat(allowed)
            .because("rules are pure, and anything past the JDK reachable from them is how I/O leaks in")
}
