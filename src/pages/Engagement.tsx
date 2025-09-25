import React, { useState, useEffect } from 'react'
import { Eye, Clock, MousePointer, TrendingUp } from 'lucide-react'
import { KPICard } from '../components/KPICard'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorMessage } from '../components/ErrorMessage'
import { SearchableTable } from '../components/SearchableTable'
import { supabase } from '../lib/supabase'

interface EngagementStats {
  top_pages_7d: Array<{ page_path: string; visits: number }>
  top_pages_30d: Array<{ page_path: string; visits: number }>
  avg_time_on_page: number
  overall_ctr: number
}

interface PageEngagement {
  page_path: string
  visits: number
  unique_users: number
  clicks: number
  ctr: number
  last_visit_at: string
}

interface DailyVisits {
  date: string
  [key: string]: string | number
}

export function Engagement() {
  const [stats, setStats] = useState<EngagementStats | null>(null)
  const [pageData, setPageData] = useState<PageEngagement[]>([])
  const [dailyVisits, setDailyVisits] = useState<DailyVisits[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'7d' | '30d'>('7d')

  const fetchEngagementData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Mock data - replace with actual Supabase queries
      const mockStats: EngagementStats = {
        top_pages_7d: [
          { page_path: '/dashboard', visits: 2341 },
          { page_path: '/universities', visits: 1876 },
          { page_path: '/matches', visits: 1432 },
          { page_path: '/funding', visits: 987 },
          { page_path: '/profile', visits: 654 }
        ],
        top_pages_30d: [
          { page_path: '/dashboard', visits: 8934 },
          { page_path: '/universities', visits: 7123 },
          { page_path: '/matches', visits: 5876 },
          { page_path: '/funding', visits: 4321 },
          { page_path: '/tvet', visits: 3456 }
        ],
        avg_time_on_page: 4.2,
        overall_ctr: 12.8
      }

      const mockPageData: PageEngagement[] = [
        { page_path: '/dashboard', visits: 2341, unique_users: 1876, clicks: 312, ctr: 13.3, last_visit_at: new Date().toISOString() },
        { page_path: '/universities', visits: 1876, unique_users: 1543, clicks: 234, ctr: 12.5, last_visit_at: new Date().toISOString() },
        { page_path: '/matches', visits: 1432, unique_users: 1234, clicks: 189, ctr: 13.2, last_visit_at: new Date().toISOString() },
        { page_path: '/funding', visits: 987, unique_users: 876, clicks: 123, ctr: 12.5, last_visit_at: new Date().toISOString() },
        { page_path: '/tvet', visits: 654, unique_users: 543, clicks: 87, ctr: 13.3, last_visit_at: new Date().toISOString() },
        { page_path: '/institutions', visits: 432, unique_users: 321, clicks: 54, ctr: 12.5, last_visit_at: new Date().toISOString() },
        { page_path: '/profile', visits: 321, unique_users: 287, clicks: 43, ctr: 13.4, last_visit_at: new Date().toISOString() }
      ]

      const mockDailyVisits: DailyVisits[] = Array.from({ length: 30 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (29 - i))
        const baseVisits = Math.floor(Math.random() * 200) + 100
        
        return {
          date: date.toISOString().split('T')[0],
          '/dashboard': baseVisits + Math.floor(Math.random() * 100),
          '/universities': baseVisits * 0.8 + Math.floor(Math.random() * 80),
          '/matches': baseVisits * 0.6 + Math.floor(Math.random() * 60),
          '/funding': baseVisits * 0.4 + Math.floor(Math.random() * 40),
          '/tvet': baseVisits * 0.3 + Math.floor(Math.random() * 30)
        }
      })

      setStats(mockStats)
      setPageData(mockPageData)
      setDailyVisits(mockDailyVisits)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch engagement data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEngagementData()
  }, [])

  const topPages = timeRange === '7d' ? stats?.top_pages_7d : stats?.top_pages_30d
  const topPage = topPages?.[0]

  const columns = [
    { key: 'page_path', label: 'Page Path' },
    { key: 'visits', label: 'Visits' },
    { key: 'unique_users', label: 'Unique Users' },
    { key: 'clicks', label: 'Clicks' },
    { 
      key: 'ctr', 
      label: 'CTR (%)',
      render: (value: number) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value >= 15 ? 'bg-green-100 text-green-800' :
          value >= 10 ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {value.toFixed(1)}%
        </span>
      )
    },
    { 
      key: 'last_visit_at', 
      label: 'Last Visit',
      render: (value: string) => new Date(value).toLocaleDateString()
    },
  ]

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} onRetry={fetchEngagementData} />

  return (
    <div className="space-y-6">
      <div>
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
            Engagement by Page & Clicks
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Analyze page performance, user engagement, and click-through rates across your platform
          </p>
        </div>
      </div>

      <div className="flex justify-center space-x-4 mb-8">
        <button
          onClick={() => setTimeRange('7d')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105 ${
            timeRange === '7d'
              ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md border border-gray-200'
          }`}
        >
          Last 7 Days
        </button>
        <button
          onClick={() => setTimeRange('30d')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105 ${
            timeRange === '30d'
              ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md border border-gray-200'
          }`}
        >
          Last 30 Days
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Top Page"
          value={topPage?.page_path || 'N/A'}
          subtitle={`${topPage?.visits || 0} visits`}
          icon={Eye}
        />
        <KPICard
          title="Total Top 5 Visits"
          value={topPages?.reduce((sum, page) => sum + page.visits, 0) || 0}
          subtitle={`${timeRange === '7d' ? 'Last 7 days' : 'Last 30 days'}`}
          icon={TrendingUp}
        />
        <KPICard
          title="Avg Time on Page"
          value={`${stats?.avg_time_on_page || 0}m`}
          subtitle="Estimated duration"
          icon={Clock}
        />
        <KPICard
          title="Overall CTR"
          value={`${stats?.overall_ctr || 0}%`}
          subtitle="Click-through rate"
          icon={MousePointer}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Visits by Page Over Time (Daily)</h2>
          <div className="space-y-3">
            {dailyVisits.slice(-7).map((day, index) => {
              const totalVisits = Object.entries(day)
                .filter(([key]) => key !== 'date')
                .reduce((sum, [, visits]) => sum + (visits as number), 0)
              
              return (
                <div key={day.date} className="flex items-center space-x-4">
                  <div className="w-16 text-sm text-gray-600">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="flex-1">
                    <div className="flex h-6 rounded-lg overflow-hidden">
                      {Object.entries(day)
                        .filter(([key]) => key !== 'date')
                        .map(([page, visits], i) => (
                          <div
                            key={page}
                            className={`${
                              ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-red-500'][i % 5]
                            }`}
                            style={{ width: `${((visits as number) / totalVisits) * 100}%` }}
                            title={`${page}: ${visits}`}
                          />
                        ))}
                    </div>
                  </div>
                  <div className="w-12 text-sm text-gray-600 text-right">{totalVisits}</div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Click-Through Rate by Page</h2>
          <div className="space-y-3">
            {pageData.slice(0, 8).map((page) => (
              <div key={page.page_path} className="flex items-center space-x-4">
                <div className="w-24 text-sm text-gray-600 truncate" title={page.page_path}>
                  {page.page_path}
                </div>
                <div className="flex-1">
                  <div className="bg-gray-200 rounded-full h-4">
                    <div
                      className={`h-4 rounded-full transition-all duration-500 ${
                        page.ctr >= 15 ? 'bg-green-500' :
                        page.ctr >= 10 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(page.ctr * 5, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="w-16 text-sm text-gray-600 text-right">{page.ctr.toFixed(1)}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <SearchableTable
        data={pageData}
        columns={columns}
        searchPlaceholder="Search pages..."
        exportFilename="page_engagement"
      />
    </div>
  )
}