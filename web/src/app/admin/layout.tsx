import type { Metadata } from 'next'

// Linked from nowhere on the site, and kept out of search as well.
export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: LayoutProps<'/admin'>) {
  return (
    <>
      <div className="aglow" aria-hidden="true" />
      {children}
    </>
  )
}
