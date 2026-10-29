package blog.domain.post.dto.response

import blog.domain.post.entity.Topic

data class TopicResponse(
    val slug: String,
    val title: String,
    val position: Int,
) {
    companion object {
        fun from(topic: Topic) = TopicResponse(slug = topic.slug, title = topic.title, position = topic.position)
    }
}
