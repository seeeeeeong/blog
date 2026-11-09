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
class AddJvmTopicSchemaTest(
    @Autowired private val jdbc: JdbcClient,
) {
    @Test
    fun `the JVM topic comes last, after Spring`() {
        val last =
            jdbc
                .sql("select slug, title from topic order by position desc limit 2")
                .query { rs, _ -> rs.getString("slug") to rs.getString("title") }
                .list()

        assertThat(last).containsExactly("jvm" to "JVM", "spring" to "Spring")
    }
}
