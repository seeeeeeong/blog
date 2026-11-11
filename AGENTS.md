# Sinseong Lee

CS 를 공부하며 정리한 개인 블로그. 글은 `web/content/posts/` 의 MDX 파일이고, 세션에서 Claude 와 함께 쓴 뒤 PR 머지로 발행한다.
Next.js (`web`) 하나로 모든 페이지를 빌드 때 정적으로 만들고, 홈 서버에 Cloudflare Tunnel 로 셀프 호스팅한다.

## Code Review Rules

### 언어와 형식

- 리뷰 코멘트와 요약은 **한국어**로 쓴다. 코드, 식별자, 파일 경로, 에러 메시지는 원문 그대로 둔다.
- 사람이 동료에게 말하듯 짧고 구체적으로. 무엇이 어떤 입력에서 어떻게 틀리는지를 먼저 쓰고, 고치는 방법은 그 다음에.

### 보안

- `.env` 값, API 키, 터널 토큰, 비밀번호가 코드·테스트·로그·글에 들어가면 P0.
- 글의 MDX 를 신뢰하지 않는 입력으로 다루는지 본다(raw HTML, 링크 스킴, 등록하지 않은 컴포넌트, 표현식).

### 글

- frontmatter 에 `title`, `description`, `date` 가 빠지거나 `date` 에 오프셋이 없으면 지적한다.
- 글이 `WIDGETS` 나 `PROSE_COMPONENTS` 에 없는 컴포넌트를 쓰면 지적한다. 렌더링 때 조용히 사라진다.

### 구조

- `src/app/nano/` 와 `src/features/widgets/iso/` 는 벤더링한 파일이다. 손으로 고치면 지적한다.
- 우리 CSS 클래스가 `nano.css` 의 Tailwind 유틸리티 이름(`table`, `hidden`, `flex` 등)과 겹치면 지적한다.
- feature 가 다른 feature 나 `app/` 을 import 하거나, 공용 폴더(`components/`, `hooks/`, `lib/`, `utils/`)가 feature 를 import 하면 지적한다. Biome 가 잡지만 새 feature 의 override 가 `biome.json` 에 빠졌는지도 본다.
- 런타임에 파일을 읽는 페이지를 만들면 지적한다. 페이지는 빌드 때 정적으로 만든다.

### 지적하지 않을 것

- 포매팅, import 순서, 줄 길이 (Biome 가 CI 에서 본다).
- 주석이 없다는 것. 오히려 코드를 되풀이하는 주석, 주석 처리된 코드, 이슈 링크 없는 `TODO` 를 지적한다.
- 취향 차이의 이름 변경 제안.
