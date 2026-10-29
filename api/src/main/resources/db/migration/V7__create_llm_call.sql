-- Every model call that answered, with what it is estimated to have cost: a month's sum is held
-- against its cap before the next call.
create table llm_call (
    id            uuid primary key,
    purpose       text        not null check (purpose in ('NOTE', 'MEMO')),
    model         text        not null check (char_length(model) between 1 and 100),
    input_tokens  integer     not null check (input_tokens >= 0),
    output_tokens integer     not null check (output_tokens >= 0),
    -- Millionths of a US dollar, rounded up.
    cost_micros   bigint      not null check (cost_micros >= 0),
    created_at    timestamptz not null
);

create index llm_call_created_at on llm_call (created_at);

create trigger llm_call_append_only
    before update or delete on llm_call
    for each row execute function reject_append_only_change();
