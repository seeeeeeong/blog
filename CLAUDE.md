# Sinseong Lee

A personal blog of computer science notes. Posts and their revisions are stored in PostgreSQL
as MDX and grouped by topic; an admin editor agent and a reader's "Ask" run on DeepSeek. It is
self-hosted on a home server behind a Cloudflare Tunnel.

`api/` is the Spring Boot app and the only Gradle module, `web/` is Next.js. The design lives in
local, uncommitted notes under `docs/`; read the relevant note before changing a module.

**Status: skeleton.** Built one pull request at a time. An architecture rule arrives with the
code it guards.

## Never do this

- **Never commit, log or print a secret**: a `.env` value, an API key, an OAuth client secret,
  a tunnel token or a password. Not in code, tests, commits, PRs or chat. CI runs gitleaks over
  the whole history.
- **Never put company-internal material in this repository.** No code, data, schema,
  internal names or screenshots from work projects.
- **Never edit a merged Flyway migration.** A change is a new migration.
- **Never build an image on the home server.** GitHub Actions builds them; the server only
  pulls and runs.
- Never start a dev server from a shell (`pnpm dev`, `bootRun`). process-compose owns them;
  see the global instructions.

## Architecture

- **Layout**: `blog/common/` (config, entity, error, util) and one package per bounded context
  under `blog/domain/` (`blog/domain/post`, `blog/domain/topic`), each in these layers:

  | Layer | Holds |
  |---|---|
  | `presentation/` | controllers |
  | `service/` | services (the transaction boundary), the module's `XxxError`, listeners, types other modules get |
  | `dto/request/`, `dto/response/` | `XxxRequest`, `XxxResponse` |
  | `domain/` | entities, value objects, rules, `repository/` (Spring Data), `event/` |
  | `infrastructure/` | `JdbcXxx` on JdbcClient, files, external clients |

  `presentation → service → domain ← infrastructure`, and `service → infrastructure` for what
  has no interface. `dto/` is used by presentation and service and reads only the domain.
  `domain/` uses only the JDK, Kotlin, JPA, Spring Data, other models and `common`'s entity and
  util. `ArchitectureTest` checks both.
- **Modules**: each `blog/domain/<context>` is a Spring Modulith module, declared in its
  `ModuleMetadata.kt` (`@ApplicationModule(id = "<context>", allowedDependencies = ...)`;
  detection is `explicitly-annotated`). Its layers are hidden; `service/` and
  `domain/event/` are opened as the named interfaces `<context> :: service` and
  `<context> :: event`; a module may open a package of value types its callers need rather
  than copy them into `service/`. `common` is an open module; `blog/domain/` is a plain
  package, not a module. `ModularityTest` verifies the boundaries, lists the modules, and finds
  any package under `blog/` or `blog/domain/` that forgot to declare itself. A new module adds
  its scope to `cog.toml`.
- **No ports**: no use-case interfaces; an interface only for an external system, named
  `XxxGateway` (`LlmGateway` for DeepSeek).
- **Events** are for side effects another module owns. A past-tense data class in
  `domain/event/` with an `eventId` (UUIDv7) and `occurredAt`, ids only, never a secret. The
  listener is `@ApplicationModuleListener(id = "<module>.<source>")`: it runs after commit on
  its own thread, and `event_publication` redelivers it, so it must be idempotent. The id and
  the event's class name and fields are stored, so changing them strands waiting events; a
  move needs a migration rewriting `event_publication.event_type`. The first event brings
  `spring-modulith-starter-jdbc` and the `event_publication` migration.
- **Rules** (`XxxPolicy`, `XxxDecision`, `XxxParser`, `XxxPrompt`, `XxxCheck`) sit in `domain/`
  and depend only on Kotlin, the JDK's pure packages and other rule classes; `ArchitectureTest`
  checks it with an allow list.
- **Value objects** are `@JvmInline value class`es with a private constructor: only `of(raw)`,
  or a decision's `Accepted`, makes one, so a value in hand is valid. Entity factories and
  methods take them, never a raw `String`. They are held to the same purity rule as the rule
  classes.
- **Persistence**: JPA, with Kotlin JDSL for queries, for what changes in place. JdbcClient
  for append-only tables, which are guarded by triggers and, in JPA, `@Immutable`.
- **DTOs**: `XxxRequest` / `XxxResponse` data classes in `dto/request/` and `dto/response/`, one
  per file. The service takes requests and returns responses (`PostResponse.from(post)`); a
  method another module calls returns a type of its own from `service/`, since `dto/` is
  hidden. Entities never leave through a controller. Validation annotations name their target
  (`@field:NotBlank`).
- **Controllers** are thin: one service call, its result returned as is. They return the
  response type, never a `ResponseEntity`; a status other than 200 is `@ResponseStatus`. One
  step per line with a named value, rather than calls nested inside calls.
- **Errors**: each module has a `service/XxxError` enum implementing `ErrorCode` (status,
  `module.snake_case` code, Korean message shown as is). The service throws
  `BlogException(XxxError.Y)`; `GlobalExceptionHandler` answers `{code, message}`. A sealed
  result only where the caller really branches on it.
- **Paths**: every endpoint is under `/api/`, which the web rewrites to the api.
- **Injected dependencies** are named after their type: `postService: PostService`.
- **Entities** are made by a named factory (`Post.draft(...)`) behind a private constructor,
  held in a variable, then saved on the next line.
- **Parameters**: a function takes four at most; a constructor keeps detekt's default, since a
  bean's parameters are its collaborators. A call with four or more arguments names them;
  detekt catches one that names none. A service method that needs more takes a request or a
  command object.
- **Transactions** stay short: no model call and no SSE inside one.

## Web

- `src/app/` holds the routes and composes features; a route's own pieces sit in its
  `_components/`. `src/features/<feature>/` holds one feature in `api/`, `components/`,
  `hooks/`, `utils/` and `views/`. `src/components/`, `src/hooks/`, `src/lib/` (talking to the
  api, app-wide state) and `src/utils/` (pure functions) are shared.
- A feature imports only itself and shared code; shared code imports no feature and no route.
  Another folder is imported through `@/`, never `../`. Biome enforces it: a new feature
  gets its own override in `biome.json`, which `test/biome.test.ts` checks.
- Tests live in `web/test/` at the path of what they test: `src/features/posts/utils/toc.ts`
  is tested by `test/features/posts/utils/toc.test.ts`.
- The browser calls `/api/*` on its own origin; Next rewrites it to the api (`BLOG_API_URL`).

## Comments

- **Few comments.** Only the "why" someone would get wrong without it: a price, a limit, a
  timeout, a cache setting, a trap. One line where possible.
- No "what", no history, no sources, nothing the code or a config key already says.
- No commented-out code. No `TODO`/`FIXME` without an issue link
  (`https://github.com/seeeeeeong/blog-v2/issues/N`); detekt rejects one without.
- Code, identifiers, comments, commits, pull request titles and the README are English.
  Design docs and pull request descriptions are Korean.

## Conventions

- Time comes from an injected `java.time.Clock`; detekt forbids `now()` and
  `currentTimeMillis`. Tests move a clock; they never sleep.
- IDs are UUIDv7 made by the application (`blog.common.util.UuidV7`).
- Closely related types share a file named after the first of them: `Slug.kt` opens with
  `Slug`, then `SlugDecision`; a module's events share `XxxEvent.kt`. A request or response
  has a file of its own. A rule or value object with its own test keeps its own file. Events
  stay top-level, never nested: their class name is stored.
- Every architecture rule has a fixture that breaks it.

## Testing

- Tests mirror production files: `PostService.kt` → `PostServiceTest.kt`, same package.
  `ConventionsTest` finds a test named after nothing.
- Each migration `V<n>__<name>.sql` has a `<Name>SchemaTest` against real PostgreSQL;
  `ConventionsTest` finds a migration without one and a schema test without a migration.
- Anything that needs Spring is a `@SpringBootTest` that imports `TestcontainersConfiguration`,
  which gives each context a database of its own in one PostgreSQL container. A controller
  test is `webEnvironment = RANDOM_PORT` and calls the running app over real HTTP. No
  `@WebMvcTest`, `@ApplicationModuleTest` or `@MockitoBean`; an external system is replaced by
  a fake `XxxGateway` bean from a `@TestConfiguration`.
- An advice with no route of its own may be tested on a standalone MockMvc with a sample
  controller, as `GlobalExceptionHandlerTest` is.
- Time moves through `MutableClock`; a test that moves it resets it.

## Commits and pull requests

- Work pull requests are **rebase merged**: every commit on the branch lands on `main` as
  written. Clean up fix-ups before merging
  (`git commit --fixup <sha>`, then `GIT_SEQUENCE_EDITOR=: git rebase -i --autosquash origin/main`).
- **Commits are English.** `<type>(<scope>): <imperative summary>`, lowercase, no period,
  72 characters at most, scope from `cog.toml`. The body is `- ` bullets in the imperative,
  the last one on tests when there are any. CI checks every commit.

  ```
  feat(api): add the post endpoints

  - Store each post with its MDX revisions under a topic
  - Answer drafts only to the admin
  - Add regression tests for slug clashes and revision order
  ```
- **Pull request titles follow the commit format**, English and checked the same way. With
  one commit, the title is its subject.
- **Pull request descriptions are Korean.** They pick sections by the change, each a list
  of `~했습니다` bullets:

  | Change | Sections |
  |---|---|
  | Most | `## 설명` |
  | A fix | `## 문제` (one or two sentences), `## 변경 사항` |
  | Rules about who may do what | add `## 동작`: each case and what it allows |
  | A migration | add `## 데이터베이스`: the migration, its constraints and triggers |

  Keep it as short as a release note: three to five bullets per section, each one line on
  what the reader can now do or what changed for them. No pixel values, colors, copy
  strings or step-by-step UI, since the diff shows those; an API change names its endpoints.
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
./gradlew check           # compile, test, ktlint, detekt, Konsist, ArchUnit, Modulith
./gradlew spotlessApply   # fix Kotlin formatting
pnpm --dir web check      # web: Biome, type check, Vitest
pnpm --dir web fix        # web: fix formatting and lint
pnpm --dir web build      # web: production build

docker compose --profile local up -d postgres   # the local database the api expects (port 55436)

# tests need Docker running: they start PostgreSQL through Testcontainers
# once per clone: hooks guard main, format staged files, verify commit messages
brew install lefthook cocogitto ktlint && lefthook install
```
