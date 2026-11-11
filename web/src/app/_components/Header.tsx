import { Container } from '@/app/_components/Container'
import { TextLink } from '@/app/_components/TextLink'
import { SITE_TITLE } from '@/lib/site'

export function Header() {
  return (
    <header>
      <Container>
        <div className="flex flex-wrap gap-y-2 justify-between">
          <TextLink href="/" underline={false}>
            <div className="font-semibold">{SITE_TITLE}</div>
          </TextLink>
          <nav className="flex gap-1">
            <TextLink href="/blog">blog</TextLink>
          </nav>
        </div>
      </Container>
    </header>
  )
}
