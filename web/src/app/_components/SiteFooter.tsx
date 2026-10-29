import { FooterMetadata } from '@/app/_components/FooterMetadata'
import { Logo } from '@/components/ui/Logo'

type Props = {
  /** When the newest post was published, as an ISO-8601 instant. */
  lastUpdated?: string
}

export function SiteFooter({ lastUpdated }: Props) {
  return (
    <footer className="site-footer">
      <div className="site-footer__band">
        <div className="meta-card">
          <FooterMetadata lastUpdated={lastUpdated} />
        </div>
      </div>
      <div className="site-footer__bottom">
        <Logo />
        <div>
          <p>© {new Date().getFullYear()} Sinseong Lee</p>
          <p>Notes on computer science, built by hand</p>
        </div>
      </div>
    </footer>
  )
}
