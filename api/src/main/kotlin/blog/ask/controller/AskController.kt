package blog.ask.controller

import blog.ask.dto.request.AskRequest
import blog.ask.service.AskService
import blog.common.web.ClientIp
import blog.common.web.EventStream
import jakarta.validation.Valid
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

/**
 * The one route a reader writes to, without signing in. Like every write it carries the CSRF token
 * the page fetched first, so another site cannot spend a reader's questions.
 */
@RestController
@RequestMapping("/api/ask")
class AskController(
    private val askService: AskService,
) {
    @PostMapping
    fun ask(
        @Valid @RequestBody request: AskRequest,
        clientIp: ClientIp,
        events: EventStream,
    ) {
        askService.ask(request, clientIp, events)
    }
}
