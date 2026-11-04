package blog.schema

import blog.TestcontainersConfiguration
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.jdbc.core.simple.JdbcClient

@SpringBootTest
@Import(TestcontainersConfiguration::class)
class DropBooksSchemaTest(
    @Autowired private val jdbc: JdbcClient,
) {
    private fun exists(table: String) =
        jdbc
            .sql("select to_regclass(:table) is not null")
            .param("table", table)
            .query(Boolean::class.java)
            .single()

    @Test
    fun `the book tables are gone`() {
        assertThat(listOf("book", "book_section", "study_note").map(::exists)).containsOnly(false)
    }

    @Test
    fun `a post no longer points at a section`() {
        val columns =
            jdbc
                .sql(
                    "select count(*) from information_schema.columns " +
                        "where table_name = 'post' and column_name = 'section_id'",
                ).query(Int::class.java)
                .single()

        assertThat(columns).isZero()
    }
}
