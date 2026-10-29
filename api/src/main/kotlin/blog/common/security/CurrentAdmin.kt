package blog.common.security

import org.springframework.security.core.annotation.AuthenticationPrincipal

/** The signed-in [SessionAdmin], as a controller parameter. */
@Target(AnnotationTarget.VALUE_PARAMETER)
@Retention(AnnotationRetention.RUNTIME)
@AuthenticationPrincipal
annotation class CurrentAdmin
