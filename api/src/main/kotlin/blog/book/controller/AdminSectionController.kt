package blog.book.controller

import blog.book.dto.response.StudyNoteResponse
import blog.book.service.AdminBookService
import blog.book.service.StudyNoteService
import blog.post.dto.response.AdminPostResponse
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/admin/sections")
class AdminSectionController(
    private val adminBookService: AdminBookService,
    private val studyNoteService: StudyNoteService,
) {
    /** "Write post": 201 with a new draft, or 200 with the post the section already has. */
    @PostMapping("/{id}/post")
    fun writePost(
        @PathVariable id: UUID,
        response: HttpServletResponse,
    ): AdminPostResponse {
        val written = adminBookService.writePost(id)
        response.status = written.status.value()
        return written.post
    }

    /** A new study note from the model, which becomes the section's note. */
    @PostMapping("/{id}/note")
    @ResponseStatus(HttpStatus.CREATED)
    fun writeNote(
        @PathVariable id: UUID,
    ): StudyNoteResponse = studyNoteService.write(id)

    @GetMapping("/{id}/note")
    fun note(
        @PathVariable id: UUID,
    ): StudyNoteResponse = studyNoteService.get(id)
}
