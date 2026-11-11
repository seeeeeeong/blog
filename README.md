# Sinseong Lee

A personal blog of computer science notes. Each post is an MDX file in
`web/content/posts/`, and the Next.js app in `web/` prerenders every page
from them. The layout is [Astro Nano](https://github.com/markhorn-dev/astro-nano) by Mark Horn
(MIT), its compiled stylesheet vendored in `web/src/app/nano/`.

## Getting started

```bash
pnpm --dir web install
pnpm --dir web check
pnpm --dir web build
```

## Writing a post

Add `web/content/posts/<slug>.mdx`:

```mdx
---
title: 프로그램 실행 흐름
description: 명령 한 줄에서 프로세스가 끝나기까지
date: 2026-11-11T21:00:00+09:00
---

본문
```

`draft: true` keeps a post off every page. Merging the pull request deploys it.

## Configuration

The web reads `NEXT_PUBLIC_SITE_URL`, the public origin its RSS feed links to, when it is
built; it defaults to `http://localhost:3150`.

## Development

See [CLAUDE.md](CLAUDE.md) for the rules this codebase follows.
