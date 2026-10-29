-- The post written for a book's section; a section has one at most.
alter table post add column section_id uuid unique references book_section (id);
