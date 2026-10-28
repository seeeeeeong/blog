package blog.post.dto.response

import blog.post.entity.Post
import blog.post.entity.Topic
import java.time.Instant

/** A published post with its body, as the reader's page renders it. */
data class PostResponse(
    val slug: String,
    val title: String,
    val summary: String,
    val topic: TopicResponse,
    val number: String,
    val publishedAt: Instant,
    val bodyMdx: String,
) {
    companion object {
        fun from(
            post: Post,
            topic: Topic,
        ) = PostResponse(
            slug = post.slug,
            title = post.title,
            summary = post.summary,
            topic = TopicResponse.from(topic),
            number = post.numberIn(topic),
            publishedAt = checkNotNull(post.publishedAt) { "Only a published post is shown" },
            bodyMdx = post.bodyMdx,
        )
    }
}
