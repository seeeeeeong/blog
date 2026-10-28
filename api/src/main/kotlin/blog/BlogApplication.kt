package blog

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class BlogApplication

@Suppress("SpreadOperator") // Once, at startup.
fun main(args: Array<String>) {
    runApplication<BlogApplication>(*args)
}
