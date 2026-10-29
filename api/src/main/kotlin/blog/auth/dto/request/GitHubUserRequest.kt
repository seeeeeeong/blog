package blog.auth.dto.request

/** The account GitHub vouched for at sign-in; many accounts set no [name]. */
data class GitHubUserRequest(
    val login: String,
    val name: String?,
    val avatarUrl: String?,
)
