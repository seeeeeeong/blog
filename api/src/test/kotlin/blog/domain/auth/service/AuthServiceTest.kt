package blog.domain.auth.service

import blog.common.exception.BlogError
import blog.common.exception.BlogException
import blog.domain.auth.dto.request.GitHubUserRequest
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.Test

class AuthServiceTest {
    private val authService = AuthService(adminGithubLogin = "seeeeeeong")

    @Test
    fun `the admin's GitHub account is admitted with its name and avatar`() {
        val admin =
            authService.admit(
                GitHubUserRequest(login = "seeeeeeong", name = "이신성", avatarUrl = "https://avatars.example/u/1"),
            )

        assertThat(admin.login).isEqualTo("seeeeeeong")
        assertThat(admin.name).isEqualTo("이신성")
        assertThat(admin.avatarUrl).isEqualTo("https://avatars.example/u/1")
    }

    @Test
    fun `an account with no name or a blank one goes by its login`() {
        val unnamed = authService.admit(GitHubUserRequest(login = "seeeeeeong", name = null, avatarUrl = null))
        val blank = authService.admit(GitHubUserRequest(login = "seeeeeeong", name = " ", avatarUrl = null))

        assertThat(unnamed.name).isEqualTo("seeeeeeong")
        assertThat(blank.name).isEqualTo("seeeeeeong")
    }

    @Test
    fun `any other account is refused as not the admin`() {
        assertThatThrownBy { authService.admit(GitHubUserRequest(login = "stranger", name = null, avatarUrl = null)) }
            .isInstanceOfSatisfying(BlogException::class.java) {
                assertThat(it.error).isEqualTo(BlogError.AUTH_NOT_ADMIN)
            }
    }

    @Test
    fun `without GitHub configured, sign-in says it is off`() {
        assertThatThrownBy { authService.loginUnavailable() }
            .isInstanceOfSatisfying(BlogException::class.java) {
                assertThat(it.error).isEqualTo(BlogError.AUTH_LOGIN_UNAVAILABLE)
            }
    }
}
