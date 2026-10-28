-- Fixed for now and changed only by migration; a topic's position is the first part of a post's number.
create table topic (
    id         uuid primary key,
    version    bigint      not null,
    slug       text        not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 100),
    title      text        not null check (char_length(title) between 1 and 100),
    position   integer     not null unique check (position > 0),
    created_at timestamptz not null
);

insert into topic (id, version, slug, title, position, created_at)
values ('019a2f00-0000-7000-8000-000000000001', 0, 'os', '운영체제', 1, '2026-10-29T00:00:00Z'),
       ('019a2f00-0000-7000-8000-000000000002', 0, 'network', '네트워크', 2, '2026-10-29T00:00:00Z'),
       ('019a2f00-0000-7000-8000-000000000003', 0, 'database', '데이터베이스', 3, '2026-10-29T00:00:00Z'),
       ('019a2f00-0000-7000-8000-000000000004', 0, 'algorithm', '자료구조와 알고리즘', 4, '2026-10-29T00:00:00Z'),
       ('019a2f00-0000-7000-8000-000000000005', 0, 'spring', 'Spring', 5, '2026-10-29T00:00:00Z');

-- The body is MDX and the source of truth; a reader sees only a published post.
create table post (
    id           uuid primary key,
    version      bigint      not null,
    slug         text        not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 100),
    title        text        not null check (char_length(title) between 1 and 200),
    topic_id     uuid        not null references topic (id),
    position     integer     not null check (position > 0),
    summary      text        not null check (char_length(summary) between 1 and 500),
    body_mdx     text        not null,
    status       text        not null check (status in ('DRAFT', 'PUBLISHED')),
    published_at timestamptz,
    created_at   timestamptz not null,
    updated_at   timestamptz not null,
    unique (topic_id, position),
    check (status <> 'PUBLISHED' or published_at is not null)
);

create index post_published_newest on post (published_at desc) where status = 'PUBLISHED';
