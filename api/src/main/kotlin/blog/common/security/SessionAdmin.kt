package blog.common.security

import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.oauth2.core.user.OAuth2User
import java.io.Serializable

/**
 * Who signed in, as the session remembers it. Spring Session serializes it into PostgreSQL by
 * class name, so moving or renaming it signs the admin out.
 */
data class SessionAdmin(
    val login: String,
    val displayName: String,
    val avatarUrl: String?,
) : OAuth2User,
    Serializable {
    override fun getName(): String = login

    override fun getAttributes(): Map<String, Any> = mapOf("login" to login)

    override fun getAuthorities(): Collection<GrantedAuthority> = listOf(SimpleGrantedAuthority(AUTHORITY))

    companion object {
        const val ROLE = "ADMIN"
        const val AUTHORITY = "ROLE_$ROLE"

        // Sessions stored before a change to this class would otherwise fail to load.
        private const val serialVersionUID = 1L
    }
}
