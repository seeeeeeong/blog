-- Books, their sections and study notes are gone; a post stands on its own.
alter table post drop column section_id;
drop table study_note;
drop table book_section;
drop table book;
