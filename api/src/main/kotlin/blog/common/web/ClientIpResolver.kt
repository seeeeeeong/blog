package blog.common.web

import jakarta.servlet.http.HttpServletRequest
import org.springframework.core.MethodParameter
import org.springframework.web.bind.support.WebDataBinderFactory
import org.springframework.web.context.request.NativeWebRequest
import org.springframework.web.method.support.HandlerMethodArgumentResolver
import org.springframework.web.method.support.ModelAndViewContainer

/**
 * Hands a controller the reader's [ClientIp]. Behind the tunnel every request comes through
 * Cloudflare, which sets `CF-Connecting-IP` to the address it was reached from and overwrites any
 * the reader sent; the web's rewrite passes it on. `X-Forwarded-For` is not used: Cloudflare appends
 * to whatever the reader sent, so its first entry is the reader's to choose. Without the header,
 * as locally where nothing stands in front, the connection's own address is used.
 */
class ClientIpResolver : HandlerMethodArgumentResolver {
    override fun supportsParameter(parameter: MethodParameter): Boolean =
        parameter.parameterType == ClientIp::class.java

    override fun resolveArgument(
        parameter: MethodParameter,
        mavContainer: ModelAndViewContainer?,
        webRequest: NativeWebRequest,
        binderFactory: WebDataBinderFactory?,
    ): ClientIp {
        val request = checkNotNull(webRequest.getNativeRequest(HttpServletRequest::class.java))
        val connecting = request.getHeader(CF_CONNECTING_IP)?.trim()?.takeIf { it.isNotEmpty() }
        return ClientIp(connecting ?: request.remoteAddr)
    }

    private companion object {
        const val CF_CONNECTING_IP = "CF-Connecting-IP"
    }
}
