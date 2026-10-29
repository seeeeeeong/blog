-- What each publish put in front of readers, numbered per post. A correction is another publish.
create table post_revision (
    id         uuid primary key,
    post_id    uuid        not null references post (id),
    number     integer     not null check (number > 0),
    slug       text        not null,
    title      text        not null,
    topic_id   uuid        not null references topic (id),
    position   integer     not null,
    summary    text        not null check (char_length(btrim(summary)) > 0),
    body_mdx   text        not null,
    created_at timestamptz not null,
    unique (post_id, number)
);

create function reject_append_only_change() returns trigger
    language plpgsql as
$$
begin
    raise exception '% is append-only: % refused', tg_table_name, tg_op;
end;
$$;

create trigger post_revision_append_only
    before update or delete on post_revision
    for each row execute function reject_append_only_change();
