// app/layouts/MainLayout.tsx
import { Outlet } from 'react-router-dom'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'

export function MainLayout() {
  return (
    <>
      <Header />
      <main>
        <Outlet /> {/* сюда React Router подставит текущую страницу */}
      </main>
      <Footer />
    </>
  )
}