-- A book the admin studies, imported once from YES24 with its contents. YES24's terms ask that its
-- page be linked wherever these details show, so the address is kept with the book.
create table book (
    id           uuid primary key,
    version      bigint      not null,
    title        text        not null check (char_length(title) between 1 and 300),
    authors      text        check (char_length(authors) between 1 and 300),
    publisher    text        check (char_length(publisher) between 1 and 100),
    isbn13       text        not null check (isbn13 ~ '^97[89][0-9]{10}$'),
    published_on date,
    source_ref   text        not null unique check (source_ref ~ '^[0-9]{1,10}$'),
    source_url   text        not null check (source_url ~ '^https://' and char_length(source_url) <= 500),
    cover_url    text        check (cover_url ~ '^https://' and char_length(cover_url) <= 500),
    topic_id     uuid        references topic (id),
    created_at   timestamptz not null
);

-- A chapter (no parent) or one of its sections, in the book's order: the study path. Imported with
-- the book and never changed.
create table book_section (
    id        uuid primary key,
    version   bigint  not null,
    book_id   uuid    not null references book (id),
    parent_id uuid,
    number    text    not null check (char_length(number) between 1 and 20),
    title     text    not null check (char_length(title) between 1 and 200),
    position  integer not null check (position > 0),
    unique (book_id, id),
    -- A section's chapter is in the same book.
    foreign key (book_id, parent_id) references book_section (book_id, id),
    -- Chapters share the null parent, which holds each position once too.
    unique nulls not distinct (book_id, parent_id, position)
);
