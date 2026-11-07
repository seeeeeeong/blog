-- Readers' Ask is gone, and what it kept goes with it: the questions, the daily counts and its calls.
drop table ask_message;
drop table ask_daily_usage;

-- The cost log is append-only; this one deletion is the migration's, not the application's.
alter table llm_call disable trigger llm_call_append_only;
delete from llm_call where purpose = 'ASK';
alter table llm_call enable trigger llm_call_append_only;

alter table llm_call drop constraint llm_call_purpose_check;
alter table llm_call add constraint llm_call_purpose_check check (purpose in ('NOTE', 'MEMO', 'REVIEW'));
