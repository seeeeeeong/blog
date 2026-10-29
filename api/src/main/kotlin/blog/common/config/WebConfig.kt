package blog.common.config

import blog.common.web.ClientIpResolver
import blog.common.web.EventStreamResolver
import org.springframework.context.annotation.Configuration
import org.springframework.web.method.support.HandlerMethodArgumentResolver
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer
import tools.jackson.databind.json.JsonMapper

@Configuration
class WebConfig(
    private val jsonMapper: JsonMapper,
) : WebMvcConfigurer {
    override fun addArgumentResolvers(resolvers: MutableList<HandlerMethodArgumentResolver>) {
        resolvers += EventStreamResolver(jsonMapper)
        resolvers += ClientIpResolver()
    }
}
