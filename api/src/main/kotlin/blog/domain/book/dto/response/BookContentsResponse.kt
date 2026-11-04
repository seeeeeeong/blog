package blog.domain.book.dto.response

import blog.domain.book.entity.TocParser

/** How contents read as the study path, before anything is stored. */
data class BookContentsResponse(
    val chapters: List<Chapter>,
) {
    data class Chapter(
        val number: String,
        val title: String,
        val sections: List<Section>,
    )

    data class Section(
        val number: String,
        val title: String,
    )

    companion object {
        fun from(chapters: List<TocParser.Chapter>) =
            BookContentsResponse(
                chapters.map { chapter ->
                    Chapter(
                        number = chapter.number,
                        title = chapter.title,
                        sections = chapter.sections.map { Section(number = it.number, title = it.title) },
                    )
                },
            )
    }
}
