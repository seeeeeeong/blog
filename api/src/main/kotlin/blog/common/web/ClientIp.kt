package blog.common.web

/** The reader's address as Cloudflare saw it, for counting what they ask; never stored as is. */
data class ClientIp(
    val address: String,
)
