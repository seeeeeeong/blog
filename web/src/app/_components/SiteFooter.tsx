import { SITE_TITLE } from '@/lib/site'

export function SiteFooter() {
  return (
    <footer className="site-footer">
      Copyright © {new Date().getFullYear()} {SITE_TITLE}
    </footer>
  )
}
