import { AdminDock } from '@/app/admin/_components/AdminDock'
import { LoginView } from '@/features/admin/views/LoginView'

export default async function LoginPage({ searchParams }: PageProps<'/admin/login'>) {
  const { error } = await searchParams
  return (
    <>
      <AdminDock />
      <LoginView error={typeof error === 'string' ? error : undefined} />
    </>
  )
}
