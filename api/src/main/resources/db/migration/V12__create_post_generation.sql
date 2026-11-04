-- Every draft the model wrote from a memo, with what its review said: a draft closed unread can be
-- found again, and real memos become the set a new prompt or model is checked against.
create table post_generation (
    id            uuid primary key,
    post_id       uuid        not null references post (id),
    memo          text        not null,
    body_mdx      text        not null,
    -- Null when the review could not be had.
    review        jsonb,
    checks        jsonb       not null,
    revised       boolean     not null,
    model         text        not null check (char_length(model) between 1 and 100),
    input_tokens  integer     not null check (input_tokens >= 0),
    output_tokens integer     not null check (output_tokens >= 0),
    created_at    timestamptz not null
);

create index post_generation_post on post_generation (post_id, created_at desc);

create trigger post_generation_append_only
    before update or delete on post_generation
    for each row execute function reject_append_only_change();
