package blog.domain.auth.entity

import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.Test

class AdminCheckTest {
    private val check = AdminCheck("seeeeeeong")

    @Test
    fun `the configured login is the admin, in any case`() {
        assertThat(check.admits("seeeeeeong")).isTrue()
        assertThat(check.admits("SEEEEEEONG")).isTrue()
    }

    @Test
    fun `another login is not, even one that only contains it`() {
        assertThat(check.admits("seeeeeeong-bot")).isFalse()
        assertThat(check.admits("")).isFalse()
    }

    @Test
    fun `a blank admin login is a misconfiguration, not an open door`() {
        assertThatThrownBy { AdminCheck(" ") }.isInstanceOf(IllegalArgumentException::class.java)
    }
}
