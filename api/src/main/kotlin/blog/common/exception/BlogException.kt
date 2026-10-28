package blog.common.exception

/** [cause] keeps what went wrong underneath for the log; the reader only sees [error]. */
open class BlogException(
    val error: ErrorCode,
    cause: Throwable? = null,
) : RuntimeException(error.code, cause)
