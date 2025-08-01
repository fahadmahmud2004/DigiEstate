import { Outlet } from "react-router-dom"
import { Header } from "./Header"
import { Sidebar } from "./Sidebar"
import { Footer } from "./Footer"

export function Layout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header />
      <div className="flex h-[calc(100vh-4rem)] pt-16">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-7xl pb-20">
            <Outlet />
          </div>
        </main>
      </div>
      <Footer />
    </div>
  )
}