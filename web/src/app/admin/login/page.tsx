import { AdminBanner } from '@/app/admin/_components/AdminBanner'
import { LoginView } from '@/features/admin/views/LoginView'

export default async function LoginPage({ searchParams }: PageProps<'/admin/login'>) {
  const { error } = await searchParams
  return (
    <>
      <AdminBanner />
      <LoginView error={typeof error === 'string' ? error : undefined} />
    </>
  )
}
