# Sinseong Lee

A personal blog of computer science notes. Each post is an MDX file in `web/content/posts/`,
written with Claude in a session and published by merging its pull request; the site is
prerendered from them. The layout is Mark Horn's Astro Nano (MIT), its compiled stylesheet
vendored in `web/src/app/nano/`. It is self-hosted on a home server behind a Cloudflare Tunnel.

`web/` is the Next.js app and the only one. The design lives in local, uncommitted notes under
`docs/`; read the relevant note before changing a feature.

**Status: skeleton.** Built one pull request at a time. An architecture rule arrives with the
code it guards.

## Never do this

- **Never commit, log or print a secret**: a `.env` value, an API key, a tunnel token or a
  password. Not in code, tests, commits, PRs or chat. CI runs gitleaks over
  the whole history.
- **Never put company-internal material in this repository.** No code, data, schema,
  internal names or screenshots from work projects.
- **Never build an image on the home server.** GitHub Actions builds it; the server only
  pulls and runs. After pushing it, CI runs the Deploy workflow of the private
  `seeeeeeong/homelab` repository, where the stack's compose file and its secrets live.
- Never start a dev server from a shell (`pnpm dev`). process-compose owns them;
  see the global instructions.

## Web

- `src/app/` holds the routes and composes features; a route's own pieces sit in its
  `_components/`. `src/features/<feature>/` holds one feature in `api/`, `components/`,
  `hooks/`, `utils/` and `views/`; a feature's `api/` is where its data comes from (the posts
  read their files there). `src/components/`, `src/hooks/`, `src/lib/` (app-wide settings) and
  `src/utils/` (pure functions) are shared.
- A feature imports only itself and shared code; shared code imports no feature and no route.
  Another folder is imported through `@/`, never `../`. Biome enforces it: a new feature
  gets its own override in `biome.json`, which `test/biome.test.ts` checks.
- Tests live in `web/test/` at the path of what they test: `src/features/posts/utils/toc.ts`
  is tested by `test/features/posts/utils/toc.test.ts`. A page test mocks the posts loader.
- Every page is prerendered: a route reads posts only through `generateStaticParams` and
  server components at build time, never on a request.
- A post's frontmatter is `title`, `description`, `date` (ISO 8601 with its offset) and an
  optional `draft: true`, which keeps it off every page. A field missing stops the build.
- `src/app/nano/nano.css` is vendored: never edit or format it. Its Tailwind utilities are the
  class names the chrome uses; a class of our own must not reuse one (`.table` is
  `display: table` there).

## Figures

- A post's figures are built at dev time with the `anatomy` skill in `.claude/skills/anatomy/`;
  its React kit is copied to `web/src/features/widgets/iso/`. Both are vendored: never edit or
  format them. `UPSTREAM.md` says what was left out and how to update, and a test checks the
  kit against `upstream.json`.
- Give the skill the real numbers. Light theme only; Korean text only in the HTML around the
  drawing (corners, legend, caption), never inside the SVG. Check it at 390 pixels wide.
- A figure is a widget: register it in `WIDGETS`, with literal string or number props only,
  since anything else in a post's MDX is dropped.
- The skill's scripts start Chrome against a page; point them at the dev server
  (`http://localhost:3150`), never start one for them.

## Comments

- **Few comments.** Only the "why" someone would get wrong without it: a price, a limit, a
  timeout, a cache setting, a trap. One line where possible.
- No "what", no history, no sources, nothing the code or a config key already says.
- No commented-out code. No `TODO`/`FIXME` without an issue link
  (`https://github.com/seeeeeeong/blog/issues/N`).
- Code, identifiers, comments, commits, pull request titles and the README are English.
  Design docs and pull request descriptions are Korean.

## Commits and pull requests

- Work pull requests are **rebase merged**: every commit on the branch lands on `main` as
  written. Clean up fix-ups before merging
  (`git commit --fixup <sha>`, then `GIT_SEQUENCE_EDITOR=: git rebase -i --autosquash origin/main`).
- **Commits are English.** `<type>(<scope>): <imperative summary>`, lowercase, no period,
  72 characters at most, scope from `cog.toml`. The body is `- ` bullets in the imperative,
  the last one on tests when there are any. CI checks every commit.

  ```
  feat(web): add the theme buttons

  - Keep the reader's light, dark or system choice in this browser
  - Switch without letting every color fade across
  - Add tests for the stored choice and its fallback
  ```
- **Pull request titles follow the commit format**, English and checked the same way. With
  one commit, the title is its subject.
- **Pull request descriptions are Korean.** They pick sections by the change, each a list
  of `~했습니다` bullets:

  | Change | Sections |
  |---|---|
  | Most | `## 설명` |
  | A fix | `## 문제` (one or two sentences), `## 변경 사항` |
  | A post | `## 글`: its title and what it covers, in a line or two |

  Keep it as short as a release note: three to five bullets per section, each one line on
  what the reader can now do or what changed for them. No pixel values, colors, copy
  strings or step-by-step UI, since the diff shows those.
  Lead with behavior a user sees, then implementation. When permissions or existing
  behavior are touched, say what stays the same (`기존 ~은 유지합니다`). No verification
  line: CI shows the checks; mention only checks CI cannot see, such as a browser pass. The
  English words developers actually say (스켈레톤, 세팅, 룰, 엔드포인트, 마이그레이션) rather
  than forced Korean. No English translation, no attribution lines.
- One change per branch, usually one commit.
- Commits are authored by the personal account, set per clone (the global identity is a
  work one):

  ```bash
  git config user.name  "seeeeeeong"
  git config user.email "136677284+seeeeeeong@users.noreply.github.com"
  ```

## Branches

- `main` is the one long-lived branch. Nothing is committed or pushed to it directly; the
  hooks refuse both.
- Branch from a fresh `origin/main`:
  `git fetch && git switch -c <type>/<english-slug> --no-track origin/main`. Without
  `--no-track` the branch pushes to `main` by default and the pre-push hook cannot resolve it.
- Pull requests target `main`. There is no `dev` branch and no release pull request.

## Commands

```bash
pnpm --dir web check      # Biome, type check, Vitest
pnpm --dir web fix        # fix formatting and lint
pnpm --dir web build      # production build; a post with a bad frontmatter fails it

# once per clone: hooks guard main, format staged files, verify commit messages
brew install lefthook cocogitto && lefthook install
```
