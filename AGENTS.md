# Sinseong Lee

CS 를 공부하며 정리한 개인 블로그. 글과 개정본을 MDX 로 PostgreSQL 에 저장하고 주제로 묶으며, 관리자 편집 에이전트와 독자의 "Ask" 는 DeepSeek 로 돈다.
Kotlin + Spring Boot 4 (`api`), Next.js (`web`), PostgreSQL 18. 홈 서버에 Cloudflare Tunnel 로 셀프 호스팅한다.

## Code Review Rules

### 언어와 형식

- 리뷰 코멘트와 요약은 **한국어**로 쓴다. 코드, 식별자, 파일 경로, 에러 메시지는 원문 그대로 둔다.
- 사람이 동료에게 말하듯 짧고 구체적으로. 무엇이 어떤 입력에서 어떻게 틀리는지를 먼저 쓰고, 고치는 방법은 그 다음에.

### 외부 API

- 가격·한도·타임아웃 값에 왜 그 값인지 한 줄이 없으면 지적한다.
- `max_tokens` 를 지정하지 않은 LLM 호출을 지적한다.
- 외부 시스템 호출이 `XxxGateway` 인터페이스 밖에서 직접 나가면 지적한다.

### 데이터와 트랜잭션

- append-only 테이블에 UPDATE·DELETE 경로를 만들면 P1.
- 트랜잭션 안에서 LLM 호출이나 SSE 송출을 하면 지적한다.
- JPA 와 JdbcClient 가 한 트랜잭션에 섞일 때 flush 없이 JdbcClient 가 JPA 가 쓴 행을 읽으면 지적한다.
- 머지된 Flyway 마이그레이션을 수정하면 P1. 새 마이그레이션에는 `<Name>SchemaTest` 가 있어야 한다.

### 보안

- `.env` 값, API 키, OAuth 시크릿, 터널 토큰, 비밀번호가 코드·테스트·로그·예외 메시지·응답에 들어가면 P0.
- 관리자 전용 API 에 권한 검사가 빠지면 P1. 관리자 라우트는 `/api/admin/` 아래에 두어 `SecurityConfig` 의 관리자 검사를 받는다. 그 밖에 쓰기(POST·PUT·PATCH·DELETE) 라우트를 만들거나 `SecurityConfig` 에서 `/api/admin/` 검사를 느슨하게 하면 P1.
- CSRF 를 끄거나 `ignoringRequestMatchers` 로 경로를 빼면 지적한다. 쓰기는 `XSRF-TOKEN` 쿠키를 `X-XSRF-TOKEN` 헤더로 돌려보낸다.
- 세션에 `SessionAdmin` 말고 GitHub 액세스 토큰이나 프로필 전체를 담으면 지적한다. 관리자가 아닌 계정에 세션이 남는 경로도 지적한다.
- 저장된 MDX 와 LLM 이 만든 글을 신뢰하지 않는 입력으로 다루는지 본다(raw HTML, 링크 스킴, 임의 컴포넌트).

### 구조 (docs 없이도 판단할 수 있게)

- 기능은 `blog/` 바로 아래 패키지(`blog/post`, `blog/auth`)이고 `controller/`, `security/`(Spring Security 설정·핸들러, `blog/auth` 만), `service/`, `dto/request/`·`dto/response/`, `repository/`, `entity/` 로 나뉜다. 이 밖의 패키지에 클래스를 두면 지적한다.
- 한 기능이 다른 기능의 `repository/`·`entity/` 를 직접 쓰면 지적한다. 다른 기능은 그 기능의 `service/` 를 부르고, 그 서비스의 요청·응답 DTO 는 써도 된다.
- 계층 방향(`controller → service → repository → entity`, `dto/` 는 controller·service 가 쓰고 entity 만 읽는다)을 거스르거나, controller 가 entity·repository 를 직접 쓰거나, `entity/` 가 HTTP·JDBC 코드를 쓰면 지적한다. 포트를 두지 않으며, 인터페이스는 외부 시스템(`XxxGateway`)에만 둔다.
- 엔티티를 Controller 가 그대로 반환하면 지적한다. `XxxResponse` 로 바꾼다.
- Controller 가 `ResponseEntity` 를 반환하거나, 에러 body 를 직접 만들거나, 서비스 호출 외의 업무 로직을 가지면 지적한다. 에러는 `common/exception/BlogError` 한 곳에 두고 `BlogException` 으로 던진다. 기능마다 에러 enum 을 따로 만들면 지적한다.
- 사용자에게 보이는 에러 메시지에 내부 정보(쿼리, 키, 경로, 스택)가 들어가면 지적한다.
- 규칙 클래스(`*Policy`, `*Decision`, `*Parser`, `*Prompt`, `*Check`)가 Kotlin, 순수 JDK, 다른 규칙 클래스 외의 것(Spring, JPA, DB, HTTP, 리포지토리 등)에 기대면 지적한다.
- 시각을 `Instant.now()`·`LocalDateTime.now()` 로 직접 얻거나 테스트에서 sleep 하면 지적한다. 주입한 `Clock` 을 쓰고, 테스트는 `MutableClock` 을 움직인다.
- 테스트가 `@WebMvcTest`, `@MockitoBean` 을 쓰면 지적한다. Spring 이 필요한 테스트는 `TestcontainersConfiguration` 을 import 한 `@SpringBootTest` 이고, Controller 테스트는 `RANDOM_PORT` 로 실제 HTTP 를 부른다.
- web 에서 feature 가 다른 feature 나 `app/` 을 import 하거나, 공용 폴더(`components/`, `hooks/`, `lib/`, `utils/`)가 feature 를 import 하면 지적한다. Biome 가 잡지만 새 feature 의 override 가 `biome.json` 에 빠졌는지도 본다.

### 지적하지 않을 것

- 포매팅, import 순서, 줄 길이 (ktlint, Biome 가 CI 에서 본다).
- 주석이 없다는 것 (위의 가격·한도·타임아웃은 제외). 오히려 코드를 되풀이하는 주석, 주석 처리된 코드, 이슈 링크 없는 `TODO` 를 지적한다.
- 취향 차이의 이름 변경 제안.
- 파일 이름과 파일당 최상위 타입 수. 한 파일에 최상위 타입 하나, 그 이름을 딴 파일이라는 규칙은 `ConventionsTest` 가 본다.
