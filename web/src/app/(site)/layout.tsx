import { SiteChrome } from '@/app/_components/SiteChrome'

export default function SiteLayout({ children }: LayoutProps<'/'>) {
  return <SiteChrome>{children}</SiteChrome>
}
