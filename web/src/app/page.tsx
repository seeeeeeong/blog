import { Hero } from '@/app/_components/Hero'
import { loadArchive } from '@/features/posts/api/archive'
import { Archive } from '@/features/posts/views/Archive'

export default async function Home() {
  const archive = await loadArchive()
  return (
    <>
      <Hero />
      <Archive archive={archive} />
    </>
  )
}
