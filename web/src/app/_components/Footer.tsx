import { BackToTop } from '@/app/_components/BackToTop'
import { Container } from '@/app/_components/Container'
import { ThemeButtons } from '@/app/_components/ThemeButtons'
import { SITE_TITLE } from '@/lib/site'

export function Footer() {
  return (
    <footer className="animate">
      <Container>
        <div className="relative">
          <div className="absolute right-0 -top-20">
            <BackToTop />
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div>
            &copy; {new Date().getFullYear()} | {SITE_TITLE}
          </div>
          <ThemeButtons />
        </div>
      </Container>
    </footer>
  )
}
