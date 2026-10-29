package blog.post.dto.response

import blog.post.entity.Post
import blog.post.entity.Topic
import java.time.Instant

/** A published post with its body, as the reader's page renders it, and its neighbours in its topic. */
data class PostResponse(
    val slug: String,
    val title: String,
    val summary: String,
    val topic: TopicResponse,
    val number: String,
    val publishedAt: Instant,
    val bodyMdx: String,
    val previous: PostSummaryResponse?,
    val next: PostSummaryResponse?,
) {
    companion object {
        fun from(
            post: Post,
            topic: Topic,
            previous: PostSummaryResponse?,
            next: PostSummaryResponse?,
        ) = PostResponse(
            slug = post.slug,
            title = post.title,
            summary = post.summary,
            topic = TopicResponse.from(topic),
            number = post.numberIn(topic),
            publishedAt = checkNotNull(post.publishedAt) { "Only a published post is shown" },
            bodyMdx = post.bodyMdx,
            previous = previous,
            next = next,
        )
    }
}
