-- A section's private study note, written by the model. Writing it again adds a row; the latest is
-- the note.
create table study_note (
    id            uuid primary key,
    section_id    uuid        not null references book_section (id),
    body_mdx      text        not null check (char_length(btrim(body_mdx)) > 0),
    model         text        not null check (char_length(model) between 1 and 100),
    input_tokens  integer     not null check (input_tokens >= 0),
    output_tokens integer     not null check (output_tokens >= 0),
    created_at    timestamptz not null
);

create index study_note_latest on study_note (section_id, created_at desc, id desc);

create trigger study_note_append_only
    before update or delete on study_note
    for each row execute function reject_append_only_change();
