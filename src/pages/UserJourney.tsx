import React, { useState, useEffect } from 'react'
import { Users, MessageCircle, Target, TrendingDown } from 'lucide-react'
import { KPICard } from '../components/KPICard'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorMessage } from '../components/ErrorMessage'
import { SearchableTable } from '../components/SearchableTable'
import { supabase } from '../lib/supabase'

interface FunnelStats {
  sessions_started: number
  page_views: number
  button_clicks: number
  conversations_started: number
  messages_exchanged: number
  conversions: number
}

interface FunnelStep {
  step: string
  count: number
  percentage: number
  dropoff: number
}

interface CohortData {
  cohort_date: string
  users: number
  sessions: number
  page_views: number
  clicks: number
  conversations: number
  messages: number
  conversions: number
  conversion_rate: number
}

interface DailyFunnel {
  date: string
  sessions: number
  page_views: number
  clicks: number
  conversations: number
  messages: number
  conversions: number
}

export function UserJourney() {
  const [funnelStats, setFunnelStats] = useState<FunnelStats | null>(null)
  const [cohortData, setCohortData] = useState<CohortData[]>([])
  const [dailyFunnel, setDailyFunnel] = useState<DailyFunnel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchJourneyData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Mock data - replace with actual Supabase queries
      const mockFunnelStats: FunnelStats = {
        sessions_started: 10000,
        page_views: 8500,
        button_clicks: 6200,
        conversations_started: 3100,
        messages_exchanged: 2400,
        conversions: 1200
      }

      const mockCohortData: CohortData[] = Array.from({ length: 12 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (i * 7))
        const users = Math.floor(Math.random() * 500) + 200
        const conversions = Math.floor(users * (0.1 + Math.random() * 0.15))
        
        return {
          cohort_date: date.toISOString().split('T')[0],
          users,
          sessions: Math.floor(users * 1.2),
          page_views: Math.floor(users * 0.85),
          clicks: Math.floor(users * 0.62),
          conversations: Math.floor(users * 0.31),
          messages: Math.floor(users * 0.24),
          conversions,
          conversion_rate: Math.round((conversions / users) * 100 * 10) / 10
        }
      }).reverse()

      const mockDailyFunnel: DailyFunnel[] = Array.from({ length: 30 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (29 - i))
        const sessions = Math.floor(Math.random() * 400) + 200
        
        return {
          date: date.toISOString().split('T')[0],
          sessions,
          page_views: Math.floor(sessions * 0.85),
          clicks: Math.floor(sessions * 0.62),
          conversations: Math.floor(sessions * 0.31),
          messages: Math.floor(sessions * 0.24),
          conversions: Math.floor(sessions * 0.12)
        }
      })

      setFunnelStats(mockFunnelStats)
      setCohortData(mockCohortData)
      setDailyFunnel(mockDailyFunnel)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user journey data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJourneyData()
  }, [])

  const funnelSteps: FunnelStep[] = funnelStats ? [
    { 
      step: 'Sessions Started', 
      count: funnelStats.sessions_started, 
      percentage: 100, 
      dropoff: 0 
    },
    { 
      step: 'Page Views', 
      count: funnelStats.page_views, 
      percentage: Math.round((funnelStats.page_views / funnelStats.sessions_started) * 100), 
      dropoff: Math.round(((funnelStats.sessions_started - funnelStats.page_views) / funnelStats.sessions_started) * 100)
    },
    { 
      step: 'Button Clicks', 
      count: funnelStats.button_clicks, 
      percentage: Math.round((funnelStats.button_clicks / funnelStats.sessions_started) * 100), 
      dropoff: Math.round(((funnelStats.page_views - funnelStats.button_clicks) / funnelStats.page_views) * 100)
    },
    { 
      step: 'Conversations Started', 
      count: funnelStats.conversations_started, 
      percentage: Math.round((funnelStats.conversations_started / funnelStats.sessions_started) * 100), 
      dropoff: Math.round(((funnelStats.button_clicks - funnelStats.conversations_started) / funnelStats.button_clicks) * 100)
    },
    { 
      step: 'Messages Exchanged', 
      count: funnelStats.messages_exchanged, 
      percentage: Math.round((funnelStats.messages_exchanged / funnelStats.sessions_started) * 100), 
      dropoff: Math.round(((funnelStats.conversations_started - funnelStats.messages_exchanged) / funnelStats.conversations_started) * 100)
    },
    { 
      step: 'Conversions', 
      count: funnelStats.conversions, 
      percentage: Math.round((funnelStats.conversions / funnelStats.sessions_started) * 100), 
      dropoff: Math.round(((funnelStats.messages_exchanged - funnelStats.conversions) / funnelStats.messages_exchanged) * 100)
    }
  ] : []

  const columns = [
    { 
      key: 'cohort_date', 
      label: 'Cohort Week',
      render: (value: string) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    },
    { key: 'users', label: 'New Users' },
    { key: 'sessions', label: 'Sessions' },
    { key: 'page_views', label: 'Page Views' },
    { key: 'clicks', label: 'Clicks' },
    { key: 'conversations', label: 'Conversations' },
    { key: 'messages', label: 'Messages' },
    { key: 'conversions', label: 'Conversions' },
    { 
      key: 'conversion_rate', 
      label: 'Conv. Rate (%)',
      render: (value: number) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value >= 15 ? 'bg-green-100 text-green-800' :
          value >= 10 ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {value}%
        </span>
      )
    },
  ]

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} onRetry={fetchJourneyData} />

  return (
    <div className="space-y-6">
      <div>
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
            User Journey Funnel
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Track user progression from session start to conversion and identify optimization opportunities
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Sessions"
          value={funnelStats?.sessions_started || 0}
          subtitle="Journey starting point"
          icon={Users}
        />
        <KPICard
          title="Conversations"
          value={funnelStats?.conversations_started || 0}
          subtitle="Engaged users"
          icon={MessageCircle}
        />
        <KPICard
          title="Conversions"
          value={funnelStats?.conversions || 0}
          subtitle="Successful matches"
          icon={Target}
        />
        <KPICard
          title="Conversion Rate"
          value={`${funnelStats ? Math.round((funnelStats.conversions / funnelStats.sessions_started) * 100) : 0}%`}
          subtitle="Overall success rate"
          icon={TrendingDown}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Conversion Funnel</h2>
          <div className="space-y-4">
            {funnelSteps.map((step, index) => (
              <div key={step.step} className="relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">{step.step}</span>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-600">{step.count.toLocaleString()}</span>
                    <span className="text-sm font-medium text-green-600">{step.percentage}%</span>
                    {index > 0 && (
                      <span className="text-xs text-red-600">-{step.dropoff}%</span>
                    )}
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${step.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Daily Funnel Drop-off (Last 30 Days)</h2>
          <div className="space-y-3">
            {dailyFunnel.slice(-7).map((day) => {
              const conversionRate = Math.round((day.conversions / day.sessions) * 100)
              return (
                <div key={day.date} className="flex items-center space-x-4">
                  <div className="w-16 text-sm text-gray-600">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="flex-1">
                    <div className="flex h-6 rounded-lg overflow-hidden">
                      <div 
                        className="bg-blue-500" 
                        style={{ width: '100%' }}
                        title={`Sessions: ${day.sessions}`}
                      />
                      <div 
                        className="bg-green-500 absolute" 
                        style={{ width: `${(day.page_views / day.sessions) * 100}%` }}
                        title={`Page Views: ${day.page_views}`}
                      />
                      <div 
                        className="bg-yellow-500 absolute" 
                        style={{ width: `${(day.clicks / day.sessions) * 100}%` }}
                        title={`Clicks: ${day.clicks}`}
                      />
                      <div 
                        className="bg-purple-500 absolute" 
                        style={{ width: `${(day.conversations / day.sessions) * 100}%` }}
                        title={`Conversations: ${day.conversations}`}
                      />
                      <div 
                        className="bg-red-500 absolute" 
                        style={{ width: `${(day.conversions / day.sessions) * 100}%` }}
                        title={`Conversions: ${day.conversions}`}
                      />
                    </div>
                  </div>
                  <div className="w-12 text-sm text-gray-600 text-right">{conversionRate}%</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <SearchableTable
        data={cohortData}
        columns={columns}
        searchPlaceholder="Search cohorts..."
        exportFilename="user_journey_cohorts"
      />
    </div>
  )
}