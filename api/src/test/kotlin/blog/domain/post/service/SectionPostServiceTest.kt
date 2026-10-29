package blog.domain.post.service

import blog.TestcontainersConfiguration
import blog.common.exception.BlogError
import blog.common.exception.BlogException
import blog.domain.post.dto.request.PostCreateRequest
import blog.domain.post.entity.PostStatus
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.jdbc.core.simple.JdbcClient
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@SpringBootTest
@Import(TestcontainersConfiguration::class)
@Transactional
class SectionPostServiceTest(
    @Autowired private val sectionPostService: SectionPostService,
    @Autowired private val adminPostService: AdminPostService,
    @Autowired private val jdbc: JdbcClient,
) {
    // A book's section, put straight into the store: the post feature knows a section by its id alone.
    private fun section(): UUID {
        val bookId = UUID.randomUUID()
        val sectionId = UUID.randomUUID()
        jdbc
            .sql(
                """
                insert into book (id, version, title, isbn13, source_ref, source_url, created_at)
                values (:id, 0, '오브젝트', '9788998139766', '1', 'https://www.yes24.com/product/goods/1', now())
                """.trimIndent(),
            ).param("id", bookId)
            .update()
        jdbc
            .sql(
                """
                insert into book_section (id, version, book_id, parent_id, number, title, position)
                values (:id, 0, :bookId, null, '1', '객체, 설계', 1)
                """.trimIndent(),
            ).param("id", sectionId)
            .param("bookId", bookId)
            .update()
        return sectionId
    }

    private fun request(title: String = "객체, 설계") = PostCreateRequest(title = title, topicSlug = "spring")

    @Test
    fun `a section's post is a draft like any other, found and listed by its section`() {
        val section = section()
        val free = adminPostService.create(request(title = "free"))

        val post = sectionPostService.create(section, request())

        assertThat(post.sectionId).isEqualTo(section)
        assertThat(post.status).isEqualTo(PostStatus.DRAFT)
        assertThat(post.position).isEqualTo(free.position + 1)
        assertThat(free.sectionId).isNull()
        assertThat(sectionPostService.find(section)?.id).isEqualTo(post.id)
        assertThat(sectionPostService.list(listOf(section, UUID.randomUUID())).keys).containsExactly(section)
    }

    @Test
    fun `a section holds one post at most`() {
        val section = section()
        sectionPostService.create(section, request())

        assertThatThrownBy { sectionPostService.create(section, request(title = "again")) }
            .isInstanceOfSatisfying(BlogException::class.java) {
                assertThat(it.error).isEqualTo(BlogError.POST_SECTION_TAKEN)
            }
    }

    @Test
    fun `no section, or one without a post, finds nothing`() {
        assertThat(sectionPostService.find(UUID.randomUUID())).isNull()
        assertThat(sectionPostService.list(emptyList())).isEmpty()
    }
}
