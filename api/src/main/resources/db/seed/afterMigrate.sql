-- Runs after every migrate, only under the local profile: sample posts for a fresh database.
-- A sample the app never saved (version 0) takes the seed's text again, so a change here reaches
-- an existing database; a row the app has saved is left as it is.
insert into post (id, version, slug, title, topic_id, position, summary, body_mdx, status,
                  published_at, created_at, updated_at)
values
       ('019a3000-0000-7000-8000-000000000001', 0, 'tcp-handshake', 'TCP 3-way handshake',
        (select id from topic where slug = 'network'), 1,
        'SYN, SYN-ACK, ACK 세 번의 교환으로 양쪽이 시퀀스 번호를 맞추고 연결을 연다.',
        $mdx$브라우저 주소창에 URL을 입력하면 HTTP 요청이 바로 나갈 것 같지만, 그 전에 클라이언트와 서버는 짧은 인사를 먼저 나눕니다. 이 인사가 끝나야 비로소 양쪽 모두 *상대가 내 말을 들을 수 있다*는 것을 확신할 수 있습니다. 그런데 인사는 왜 두 번이 아니라 꼭 세 번일까요?

## 세 번의 인사

연결을 여는 이 인사를 **3-way 핸드셰이크(three-way handshake)**라고 부릅니다. 아래 그림에서 왼쪽이 **클라이언트**, 오른쪽이 **서버**이고, 아래로 갈수록 시간이 흐릅니다.

<HandshakeWidget />

1. 재생 버튼을 누르고 <Seek to={0.35}>SYN이 서버에 닿는 순간</Seek>에서 멈춰 봅시다.
2. 슬라이더를 <Seek to={0.95}>양쪽 모두 `ESTABLISHED`가 되는 순간</Seek>까지 옮겨 봅시다.
3. 시나리오를 <ScenarioLink to="loss">SYN 유실</ScenarioLink>로 바꿔 재전송을 지켜봅시다.

처음에 클라이언트는 <Tone color="orange">**SYN**</Tone> 세그먼트를 보내며 자신의 초기 시퀀스 번호(ISN)를 알립니다. 서버는 이를 받아 <Tone color="teal">**SYN-ACK**</Tone>로 답하는데, 여기에는 클라이언트의 ISN에 1을 더한 확인 번호와 서버 자신의 ISN이 함께 실립니다. 마지막으로 클라이언트가 <Tone color="blue">**ACK**</Tone>를 보내면 양쪽 모두 `ESTABLISHED` 상태가 됩니다. 첫 SYN이 사라지면 클라이언트는 타임아웃을 기다렸다가 다시 보냅니다. Linux 기본값에서 첫 재전송 타임아웃은 1초이고, 이후 지수적으로 늘어납니다.

## 왜 두 번이 아니라 세 번인가

두 번만 주고받으면 서버는 자신이 보낸 SYN-ACK가 클라이언트에 도착했는지 알 수 없습니다. 네트워크에 오래 머물던 <Mark>이전 연결의 SYN</Mark>이 뒤늦게 도착하면, 서버는 아무도 기다리지 않는 연결에 자원을 할당하게 됩니다.

<WidgetIdea note="두 번만 주고받을 때 늦게 도착한 옛 SYN에 서버가 연결을 열어 두는 모습과, 세 번째 ACK가 그것을 막는 모습을 나란히 보여 준다" />

<Callout label="핵심">
세 번째 ACK는 "네 시퀀스 번호를 나도 확인했다"는 서명입니다. 양방향 각각에 대해 SYN과 ACK가 한 번씩 필요하고, 가운데 두 개를 하나로 합쳤기 때문에 세 번이 됩니다.
</Callout>

## 코드에서 보이는 지점

애플리케이션 코드에는 핸드셰이크가 직접 드러나지 않습니다. 커널이 `accept()` 이전에 처리를 끝내기 때문입니다.

```kotlin title="Server.kt"
val server = ServerSocket(8080, 128)

while (true) {
    val socket = server.accept()
    handle(socket)
}
```

두 번째 인자인 backlog는 핸드셰이크를 마치고 `accept()`를 기다리는 연결 큐의 크기입니다. 이 큐가 가득 차면 새 연결의 SYN은 무시되고, 클라이언트 쪽에서는 재전송이 일어납니다.

<WidgetIdea note="SYN 큐와 Accept 큐가 차오르다 넘치는 모습" />

- **SYN 큐**: SYN을 받고 ACK를 기다리는 반쯤 열린 연결
- **Accept 큐**: 핸드셰이크가 끝나 애플리케이션을 기다리는 연결

## 마무리

세 번의 교환은 양쪽이 서로의 시퀀스 번호를 확인했다는 사실을 각자 알기 위한 최소한입니다. 마지막 ACK가 도착해야 서버도 연결을 `ESTABLISHED`로 확정합니다.$mdx$,
        'PUBLISHED', '2026-10-21T09:00:00+09:00', '2026-10-21T09:00:00+09:00', '2026-10-21T09:00:00+09:00'),
       ('019a3000-0000-7000-8000-000000000002', 0, 'isolation-level', '트랜잭션 격리 수준',
        (select id from topic where slug = 'database'), 2,
        'Read Uncommitted 부터 Serializable 까지, 각 수준이 막는 이상 현상.',
        $mdx$## 이상 현상

Dirty read, non-repeatable read, phantom read 를 어디까지 허용하느냐가 격리 수준을 가른다.
$mdx$,
        'PUBLISHED', '2026-09-30T09:00:00+09:00', '2026-09-30T09:00:00+09:00', '2026-09-30T09:00:00+09:00'),
       ('019a3000-0000-7000-8000-000000000003', 0, 'btree-index', 'B-Tree 인덱스는 왜 빠른가',
        (select id from topic where slug = 'database'), 1,
        '높이가 낮은 균형 트리가 디스크 접근 횟수를 줄이는 방식.',
        $mdx$## 페이지 단위

노드 하나가 디스크 페이지 하나에 맞춰져, 트리의 높이가 곧 읽는 페이지 수가 된다.
$mdx$,
        'PUBLISHED', '2026-08-12T09:00:00+09:00', '2026-08-12T09:00:00+09:00', '2026-08-12T09:00:00+09:00'),
       ('019a3000-0000-7000-8000-000000000004', 0, 'virtual-memory', '가상 메모리와 페이지 폴트',
        (select id from topic where slug = 'os'), 3,
        '프로세스마다 주어진 주소 공간과, 없는 페이지를 만났을 때 일어나는 일.',
        $mdx$## 주소 변환

MMU 가 페이지 테이블로 가상 주소를 물리 주소로 바꾼다.
$mdx$,
        'PUBLISHED', '2026-06-03T09:00:00+09:00', '2026-06-03T09:00:00+09:00', '2026-06-03T09:00:00+09:00'),
       ('019a3000-0000-7000-8000-000000000005', 0, 'http-versions', 'HTTP/1.1에서 HTTP/3까지',
        (select id from topic where slug = 'network'), 2,
        '연결 재사용, 멀티플렉싱, QUIC 으로 이어진 변화.',
        $mdx$## Head-of-line blocking

HTTP/2 는 애플리케이션 계층의 HOL 을 풀었지만 TCP 의 것은 남았다.
$mdx$,
        'PUBLISHED', '2026-04-15T09:00:00+09:00', '2026-04-15T09:00:00+09:00', '2026-04-15T09:00:00+09:00'),
       ('019a3000-0000-7000-8000-000000000006', 0, 'process-thread', '프로세스와 스레드',
        (select id from topic where slug = 'os'), 1,
        '무엇을 나눠 갖고 무엇을 따로 갖는지.',
        $mdx$## 공유하는 것

같은 프로세스의 스레드는 코드, 데이터, 힙을 나눠 쓰고 스택과 레지스터는 따로 갖는다.
$mdx$,
        'PUBLISHED', '2026-02-20T09:00:00+09:00', '2026-02-20T09:00:00+09:00', '2026-02-20T09:00:00+09:00'),
       ('019a3000-0000-7000-8000-000000000007', 0, 'spring-propagation', 'Spring 트랜잭션 전파',
        (select id from topic where slug = 'spring'), 1,
        'REQUIRED 와 REQUIRES_NEW 가 실제로 만드는 트랜잭션.',
        $mdx$## 프록시

`@Transactional` 은 프록시를 거칠 때만 동작한다. 같은 클래스 안의 호출은 프록시를 지나지 않는다.
$mdx$,
        'PUBLISHED', '2025-12-09T09:00:00+09:00', '2025-12-09T09:00:00+09:00', '2025-12-09T09:00:00+09:00'),
       ('019a3000-0000-7000-8000-000000000008', 0, 'hash-table', '해시 테이블과 충돌 해결',
        (select id from topic where slug = 'algorithm'), 2,
        '체이닝과 개방 주소법, 그리고 적재율.',
        $mdx$자바에서 `map.put("pear", 6)`을 부르면 `HashMap`은 들어 있는 키를 하나씩 비교하지 않고, 키에서 칸 번호를 바로 계산해 그 칸으로 갑니다. 그런데 키 여섯 개를 칸 여덟 개에 넣는데 그중 셋이 같은 칸을 고른다면, 셋은 어디에 들어갈까요?

## 체이닝

**해시 테이블(hash table)**은 키의 `hashCode`를 칸 수에 맞게 줄여 칸 번호로 씁니다. 서로 다른 키가 같은 칸을 고르는 것이 **충돌(collision)**이고, **체이닝(chaining)**은 그 칸에 키를 차례로 이어 붙여 충돌을 풉니다.

<HashTableFigure part="chaining" />

1. 슬라이더를 0으로 돌린 뒤 키 넣기를 눌러 하나씩 넣어 봅시다.
2. lemon, kiwi, pear가 모두 2번 칸에 쌓이는지 확인해 봅시다.

## 선형 탐사

**개방 주소법(open addressing)**은 한 칸에 키를 하나만 둡니다. **선형 탐사(linear probing)**는 고른 칸이 차 있으면 바로 오른쪽 칸을 보고, 빈 칸이 나올 때까지 옮겨 갑니다.

<HashTableFigure part="probing" />

1. 마지막 키 pear가 몇 칸을 확인하는지 세어 봅시다.
2. 차 있는 칸이 이어진 덩어리가 키를 넣을수록 길어지는지 지켜 봅시다.

## 적재율

**적재율(load factor)**은 키 수를 칸 수로 나눈 값입니다. 적재율이 높아지면 충돌이 늘어 평균 탐색 비용이 커지므로, `HashMap`은 적재율이 0.75를 넘으면 칸을 두 배로 늘리고 모든 키의 칸을 다시 구합니다.

<HashTableFigure part="load" />

1. 키를 하나 더 넣어 칸이 4개에서 8개로 늘어나게 해 봅시다.
2. 리사이즈 뒤 자리를 옮기는 키가 무엇인지 찾아 봅시다.

## 마무리

충돌은 피할 수 없습니다. 체이닝은 같은 칸 안에서, 선형 탐사는 이웃 칸에서 충돌을 풀고, 적재율을 0.75 아래로 지키면 어느 쪽이든 탐색이 짧게 유지됩니다.
$mdx$,
        'PUBLISHED', '2025-11-02T09:00:00+09:00', '2025-11-02T09:00:00+09:00', '2025-11-02T09:00:00+09:00'),
       ('019a3000-0000-7000-8000-000000000009', 0, 'cpu-scheduling', 'CPU 스케줄링',
        (select id from topic where slug = 'os'), 2,
        'FCFS, SJF, Round Robin 이 응답 시간과 처리량을 바꾸는 방식.',
        $mdx$## 문맥 교환

타임 슬라이스가 너무 짧으면 문맥 교환 비용이 일을 잡아먹는다.
$mdx$,
        'PUBLISHED', '2025-07-18T09:00:00+09:00', '2025-07-18T09:00:00+09:00', '2025-07-18T09:00:00+09:00'),
       ('019a3000-0000-7000-8000-000000000010', 0, 'sorting', '정렬 알고리즘 비교',
        (select id from topic where slug = 'algorithm'), 1,
        '안정성, 제자리 여부, 평균과 최악의 시간 복잡도.',
        $mdx$## 안정 정렬

같은 키의 원래 순서를 지키는 정렬이 안정 정렬이다.
$mdx$,
        'PUBLISHED', '2025-05-06T09:00:00+09:00', '2025-05-06T09:00:00+09:00', '2025-05-06T09:00:00+09:00')
on conflict (id) do update
    set title = excluded.title, summary = excluded.summary, body_mdx = excluded.body_mdx
    where post.version = 0;
