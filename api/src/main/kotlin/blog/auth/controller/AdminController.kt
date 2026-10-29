package blog.auth.controller

import blog.auth.dto.response.AdminResponse
import blog.auth.service.AuthService
import blog.common.security.CurrentAdmin
import blog.common.security.SessionAdmin
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/admin")
class AdminController(
    private val authService: AuthService,
) {
    @GetMapping("/me")
    fun me(
        @CurrentAdmin admin: SessionAdmin,
    ): AdminResponse = authService.me(admin)
}
