package blog.domain.auth.entity

/** The blog has one admin, its owner, known by a GitHub login; GitHub ignores case in a login, and so does this. */
class AdminCheck(
    private val adminLogin: String,
) {
    init {
        require(adminLogin.isNotBlank()) { "An admin login is configured" }
    }

    fun admits(login: String): Boolean = login.equals(adminLogin, ignoreCase = true)
}
