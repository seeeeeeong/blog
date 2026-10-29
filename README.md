# Sinseong Lee

A personal blog of computer science notes: posts written in MDX, grouped by topic, with an
editor agent for the author and an "Ask" beside each post for readers.

`api/` is Spring Boot (Kotlin), `web/` is Next.js, PostgreSQL stores the posts.

## Getting started

```bash
docker compose --profile local up -d postgres
./gradlew check
pnpm --dir web install
pnpm --dir web check
```

## Configuration

[`.env.example`](.env.example) lists the settings. The web reads `NEXT_PUBLIC_SITE_URL`, the
public origin its RSS feed links to, when it is built; it defaults to `http://localhost:3150`.

## Development

See [CLAUDE.md](CLAUDE.md) for the rules this codebase follows.
