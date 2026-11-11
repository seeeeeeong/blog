import type { Metadata } from 'next'
import { Container } from '@/app/_components/Container'
import { TextLink } from '@/app/_components/TextLink'
import { loadPosts } from '@/features/posts/api/posts'
import { ArrowCard } from '@/features/posts/components/ArrowCard'
import { GITHUB_URL, SITE_DESCRIPTION, SITE_TITLE } from '@/lib/site'

export const metadata: Metadata = { title: 'Home' }

const LATEST = 3

export default async function Home() {
  const latest = (await loadPosts()).slice(0, LATEST)
  return (
    <Container>
      <h1 className="animate font-semibold text-black dark:text-white">
        Hi, I'm Sinseong{' '}
        <span className="text-xl" aria-hidden="true">
          👋🏻
        </span>
      </h1>
      <div className="space-y-16">
        <section>
          <article className="space-y-4">
            <p className="animate">{SITE_DESCRIPTION}을 올립니다.</p>
          </article>
        </section>
        {latest.length > 0 && (
          <section className="animate space-y-6">
            <div className="flex flex-wrap gap-y-2 items-center justify-between">
              <h2 className="font-semibold text-black dark:text-white">Latest posts</h2>
              <TextLink href="/blog">See all posts</TextLink>
            </div>
            <ul className="flex flex-col gap-4">
              {latest.map((post) => (
                <li key={post.slug}>
                  <ArrowCard post={post} />
                </li>
              ))}
            </ul>
          </section>
        )}
        <section className="animate space-y-4">
          <h2 className="font-semibold text-black dark:text-white">Let's Connect</h2>
          <ul className="flex flex-wrap gap-2">
            <li className="flex gap-x-2 text-nowrap">
              <TextLink href={GITHUB_URL} external aria-label={`${SITE_TITLE} on github`}>
                github
              </TextLink>
            </li>
          </ul>
        </section>
      </div>
    </Container>
  )
}
