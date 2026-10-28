package fixtures.framework

import org.springframework.expression.spel.standard.SpelExpressionParser

/** Breaks the rule through a framework type whose name only looks like a rule's. */
class ForeignDecisionPolicy {
    fun parser(): SpelExpressionParser = SpelExpressionParser()
}
