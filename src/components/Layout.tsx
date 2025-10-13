import { Navigation } from './Navigation'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Navigation />
      <main className="flex-1 ml-64 px-8 py-8">
        {children}
      </main>
    </div>
  )
}