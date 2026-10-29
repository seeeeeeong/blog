-- A draft may wait for its summary; a published post, the only kind a reader sees, still needs one.
alter table post drop constraint post_summary_check;

alter table post add constraint post_summary_check
    check (char_length(summary) <= 500 and (status <> 'PUBLISHED' or char_length(btrim(summary)) > 0));
