package blog.auth.dto.response

import blog.common.security.SessionAdmin

data class AdminResponse(
    val login: String,
    val name: String,
    val avatarUrl: String?,
) {
    companion object {
        fun from(admin: SessionAdmin) =
            AdminResponse(login = admin.login, name = admin.displayName, avatarUrl = admin.avatarUrl)
    }
}
