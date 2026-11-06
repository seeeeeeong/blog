import { AdminBanner } from '@/app/admin/_components/AdminBanner'
import { AdminGate } from '@/features/admin/components/AdminGate'

export default function ConsoleLayout({ children }: LayoutProps<'/admin'>) {
  return (
    <>
      <AdminBanner signedIn />
      <AdminGate>{children}</AdminGate>
    </>
  )
}
