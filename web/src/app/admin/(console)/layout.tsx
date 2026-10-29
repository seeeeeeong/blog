import { AdminDock } from '@/app/admin/_components/AdminDock'
import { AdminGate } from '@/features/admin/components/AdminGate'

export default function ConsoleLayout({ children }: LayoutProps<'/admin'>) {
  return (
    <>
      <AdminDock signedIn />
      <AdminGate>{children}</AdminGate>
    </>
  )
}
