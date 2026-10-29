#!/usr/bin/env bash
# Dumps the blog's database to /opt/blog/backup/blog-<weekday>.dump; each weekday's file is
# overwritten a week later, so seven are kept. Restore with pg_restore --clean.
set -euo pipefail

BLOG_DIR=${BLOG_DIR:-/opt/blog}
BACKUP_DIR=${BACKUP_DIR:-$BLOG_DIR/backup}

umask 077
mkdir -p "$BACKUP_DIR"

target="$BACKUP_DIR/blog-$(LC_ALL=C date +%a | tr '[:upper:]' '[:lower:]').dump"
partial="$target.partial"
trap 'rm -f "$partial"' EXIT

# Sessions are short-lived and hold who is signed in; their tables are kept, their rows are not.
docker compose --project-directory "$BLOG_DIR" exec -T postgres \
  pg_dump --username=blog --dbname=blog --format=custom --exclude-table-data='spring_session*' \
  >"$partial"

chmod 600 "$partial"
mv "$partial" "$target"
