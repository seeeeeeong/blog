-- Ask runs on the model too, under a cap of its own.
alter table llm_call drop constraint llm_call_purpose_check;
alter table llm_call add constraint llm_call_purpose_check check (purpose in ('NOTE', 'MEMO', 'ASK'));

-- A reader's questions today, counted by a keyed hash of their address that changes every day; the
-- address itself is never stored. Days before today are deleted as questions come in.
create table ask_daily_usage (
    ip_hash text    not null check (ip_hash ~ '^[0-9a-f]{64}$'),
    day     date    not null,
    count   integer not null check (count > 0),
    primary key (ip_hash, day)
);

create index ask_daily_usage_day on ask_daily_usage (day);

-- What readers asked and what they were answered, with nothing that names the reader. A conversation is
-- the id the reader's page sends back; post_id is the post they asked on, null on the home page.
create table ask_message (
    id              uuid primary key,
    conversation_id uuid        not null,
    post_id         uuid references post (id),
    role            text        not null check (role in ('USER', 'ASSISTANT')),
    content         text        not null check (char_length(btrim(content)) > 0),
    -- Whether an answer came from the blog's posts; a question has none.
    grounded        boolean,
    created_at      timestamptz not null,
    check ((role = 'ASSISTANT') = (grounded is not null))
);

create index ask_message_conversation on ask_message (conversation_id, created_at);

create trigger ask_message_append_only
    before update or delete on ask_message
    for each row execute function reject_append_only_change();
