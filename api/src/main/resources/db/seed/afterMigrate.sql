-- Runs after every migrate, only under the local profile: sample posts for a fresh database.
-- Skips any row that is already there, so it never overwrites a local edit.
insert into post (id, version, slug, title, topic_id, position, summary, body_mdx, status,
                  published_at, created_at, updated_at)
values
       ('019a3000-0000-7000-8000-000000000001', 0, 'tcp-handshake', 'TCP 3-way handshake',
        (select id from topic where slug = 'network'), 1,
        'SYN, SYN-ACK, ACK 세 번의 교환으로 양쪽이 시퀀스 번호를 맞추고 연결을 연다.',
        $mdx$## 왜 세 번인가

클라이언트와 서버는 서로의 초기 시퀀스 번호(ISN)를 알아야 데이터를 순서대로 받을 수 있다.

1. 클라이언트가 `SYN` 에 자신의 ISN 을 담아 보낸다.
2. 서버가 `SYN-ACK` 로 그 번호를 확인하고 자신의 ISN 을 보낸다.
3. 클라이언트가 `ACK` 로 서버의 번호를 확인한다.

두 번으로는 서버가 자신의 ISN 이 전달됐는지 알 수 없다.
$mdx$,
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
        $mdx$## 적재율

적재율이 높아지면 충돌이 늘어 평균 탐색 비용이 커진다.
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
on conflict do nothing;
