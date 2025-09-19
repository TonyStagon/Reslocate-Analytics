import React, { useState } from 'react'
import { Layout } from './components/Layout'
import { Navigation } from './components/Navigation'
import { Overview } from './pages/Overview'
import { Universities } from './pages/Universities'
import { TVET } from './pages/TVET'
import { Matches } from './pages/Matches'
import { Funding } from './pages/Funding'
import { Institutions } from './pages/Institutions'

function App() {
  const [currentPage, setCurrentPage] = useState('overview')

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'overview':
        return <Overview />
      case 'universities':
        return <Universities />
      case 'tvet':
        return <TVET />
      case 'matches':
        return <Matches />
      case 'funding':
        return <Funding />
      case 'institutions':
        return <Institutions />
      default:
        return <Overview />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderCurrentPage()}
      </main>
    </div>
  )
}

export default App