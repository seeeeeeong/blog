package blog.common.web

import jakarta.servlet.http.HttpServletResponse
import org.springframework.core.MethodParameter
import org.springframework.web.bind.support.WebDataBinderFactory
import org.springframework.web.context.request.NativeWebRequest
import org.springframework.web.method.support.HandlerMethodArgumentResolver
import org.springframework.web.method.support.ModelAndViewContainer
import tools.jackson.databind.json.JsonMapper

/** Hands a controller an [EventStream] on its response, which the controller's service writes. */
class EventStreamResolver(
    private val jsonMapper: JsonMapper,
) : HandlerMethodArgumentResolver {
    override fun supportsParameter(parameter: MethodParameter): Boolean =
        parameter.parameterType == EventStream::class.java

    override fun resolveArgument(
        parameter: MethodParameter,
        mavContainer: ModelAndViewContainer?,
        webRequest: NativeWebRequest,
        binderFactory: WebDataBinderFactory?,
    ): EventStream {
        // The answer is written to the response, so Spring looks for no view once the method returns.
        mavContainer?.isRequestHandled = true
        val response = checkNotNull(webRequest.getNativeResponse(HttpServletResponse::class.java))
        return EventStream(response, jsonMapper)
    }
}
