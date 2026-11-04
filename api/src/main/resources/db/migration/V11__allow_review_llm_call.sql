-- A draft's review is billed apart from its writing, under the same monthly cap.
alter table llm_call drop constraint llm_call_purpose_check;
alter table llm_call add constraint llm_call_purpose_check check (purpose in ('NOTE', 'MEMO', 'ASK', 'REVIEW'));
