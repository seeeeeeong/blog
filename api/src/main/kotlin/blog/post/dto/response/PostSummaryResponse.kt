package blog.post.dto.response

import blog.post.entity.Post
import blog.post.entity.Topic
import java.time.Instant

/** A published post in the list, without its body. */
data class PostSummaryResponse(
    val slug: String,
    val title: String,
    val summary: String,
    val topic: TopicResponse,
    val number: String,
    val publishedAt: Instant,
) {
    companion object {
        fun from(
            post: Post,
            topic: Topic,
        ) = PostSummaryResponse(
            slug = post.slug,
            title = post.title,
            summary = post.summary,
            topic = TopicResponse.from(topic),
            number = post.numberIn(topic),
            publishedAt = checkNotNull(post.publishedAt) { "Only a published post is listed" },
        )
    }
}
