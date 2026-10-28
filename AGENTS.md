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
- 관리자 전용 API 에 권한 검사가 빠지면 P1.
- 저장된 MDX 와 LLM 이 만든 글을 신뢰하지 않는 입력으로 다루는지 본다(raw HTML, 링크 스킴, 임의 컴포넌트).

### 구조 (docs 없이도 판단할 수 있게)

- 다른 모듈은 그 모듈이 `@NamedInterface` 로 연 패키지만 쓴다: `service/`, 이벤트 계약 `domain/event/`, 그리고 모듈이 따로 연 값 타입 패키지. 그 밖의 패키지(`domain/` 엔티티, `domain/repository/`, `infrastructure/`, `presentation/`, `dto/` 등) 타입을 직접 쓰면 지적한다. 열린 패키지의 타입을 `service/` 로 복제하라고 하지 않는다.
- 계층 방향(`presentation → service → domain ← infrastructure`, `dto/` 는 presentation·service 가 쓰고 domain 만 읽는다)을 거스르거나, `domain/` 이 HTTP·JDBC 코드를 쓰면 지적한다. 단 `service → infrastructure` 직접 의존(`JdbcXxx` 등)은 허용한다. 포트를 두지 않으며, 인터페이스는 외부 시스템(`XxxGateway`)에만 둔다.
- 엔티티를 Controller 가 그대로 반환하면 지적한다. `XxxResponse` 로 바꾼다.
- Controller 가 `ResponseEntity` 를 반환하거나, 에러 body 를 직접 만들거나, 서비스 호출 외의 업무 로직을 가지면 지적한다. 에러는 모듈의 `XxxError` 를 `BlogException` 으로 던진다.
- 사용자에게 보이는 에러 메시지에 내부 정보(쿼리, 키, 경로, 스택)가 들어가면 지적한다.
- 규칙 클래스(`*Policy`, `*Decision`, `*Parser`, `*Prompt`, `*Check`)와 값 객체가 Kotlin, 순수 JDK, 다른 규칙 클래스 외의 것(Spring, JPA, DB, HTTP, 리포지토리 등)에 기대면 지적한다.
- 시각을 `Instant.now()`·`LocalDateTime.now()` 로 직접 얻거나 테스트에서 sleep 하면 지적한다. 주입한 `Clock` 을 쓰고, 테스트는 `MutableClock` 을 움직인다.
- 이벤트 클래스를 다른 클래스 안에 중첩하거나, `event_publication.event_type` 을 고치는 마이그레이션 없이 이름·패키지를 바꾸면 지적한다. `event_publication` 이 클래스 이름으로 저장해 두어 대기 중인 이벤트가 끊긴다.
- 테스트가 `@WebMvcTest`, `@ApplicationModuleTest`, `@MockitoBean` 을 쓰면 지적한다. Spring 이 필요한 테스트는 `TestcontainersConfiguration` 을 import 한 `@SpringBootTest` 이고, Controller 테스트는 `RANDOM_PORT` 로 실제 HTTP 를 부른다.
- web 에서 feature 가 다른 feature 나 `app/` 을 import 하거나, 공용 폴더(`components/`, `hooks/`, `lib/`, `utils/`)가 feature 를 import 하면 지적한다. Biome 가 잡지만 새 feature 의 override 가 `biome.json` 에 빠졌는지도 본다.

### 지적하지 않을 것

- 포매팅, import 순서, 줄 길이 (ktlint, Biome 가 CI 에서 본다).
- 주석이 없다는 것 (위의 가격·한도·타임아웃은 제외). 오히려 코드를 되풀이하는 주석, 주석 처리된 코드, 이슈 링크 없는 `TODO` 를 지적한다.
- 취향 차이의 이름 변경 제안.
- 밀접한 타입이 한 파일에 있는 것 (`Slug.kt` 의 `SlugDecision`, `PostEvent.kt` 의 이벤트들). 파일 이름은 첫 타입을 따르고 `ConventionsTest` 가 본다.
