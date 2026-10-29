import '@/app/_components/not-found.css'

export function Missing() {
  return (
    <main className="missing">
      <p className="missing__code mono">404 / Not found</p>
      <h1>찾는 글이 없습니다</h1>
      <p className="missing__text">주소가 바뀌었거나 아직 공개하지 않은 글입니다.</p>
      <a className="missing__home" href="/">
        목록으로
      </a>
    </main>
  )
}
