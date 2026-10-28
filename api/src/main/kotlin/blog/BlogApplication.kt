package blog

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.modulith.Modulithic

@Modulithic
@SpringBootApplication
class BlogApplication

@Suppress("SpreadOperator") // Once, at startup.
fun main(args: Array<String>) {
    runApplication<BlogApplication>(*args)
}
