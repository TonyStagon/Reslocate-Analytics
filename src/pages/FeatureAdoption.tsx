import React, { useState, useEffect } from 'react'
import { Users, UserCheck, Repeat, TrendingUp } from 'lucide-react'
import { KPICard } from '../components/KPICard'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorMessage } from '../components/ErrorMessage'
import { SearchableTable } from '../components/SearchableTable'

interface AdoptionStats {
  new_users_today: number
  returning_users_today: number
  retention_7d: number
  retention_28d: number
}

interface CohortRetention {
  cohort_week: string
  new_users: number
  wk1_retained: number
  wk4_retained: number
  wk1_retention_rate: number
  wk4_retention_rate: number
  conv_rate: number
  match_rate: number
}

interface FeatureAdoption {
  week: string
  clicks_adoption: number
  conversation_adoption: number
  match_adoption: number
}

interface DailyUsers {
  date: string
  new_users: number
  returning_users: number
}

export function FeatureAdoption() {
  const [stats, setStats] = useState<AdoptionStats | null>(null)
  const [cohortData, setCohortData] = useState<CohortRetention[]>([])
  const [adoptionTrends, setAdoptionTrends] = useState<FeatureAdoption[]>([])
  const [dailyUsers, setDailyUsers] = useState<DailyUsers[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'60d' | '90d'>('60d')

  const fetchAdoptionData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Mock data - replace with actual Supabase queries
      const mockStats: AdoptionStats = {
        new_users_today: 234,
        returning_users_today: 1876,
        retention_7d: 42.3,
        retention_28d: 18.7
      }

      const mockCohortData: CohortRetention[] = Array.from({ length: 12 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (i * 7))
        const newUsers = Math.floor(Math.random() * 500) + 200
        const wk1Retained = Math.floor(newUsers * (0.3 + Math.random() * 0.3))
        const wk4Retained = Math.floor(wk1Retained * (0.4 + Math.random() * 0.3))
        
        return {
          cohort_week: date.toISOString().split('T')[0],
          new_users: newUsers,
          wk1_retained: wk1Retained,
          wk4_retained: wk4Retained,
          wk1_retention_rate: Math.round((wk1Retained / newUsers) * 100 * 10) / 10,
          wk4_retention_rate: Math.round((wk4Retained / newUsers) * 100 * 10) / 10,
          conv_rate: Math.round((Math.floor(newUsers * 0.15) / newUsers) * 100 * 10) / 10,
          match_rate: Math.round((Math.floor(newUsers * 0.25) / newUsers) * 100 * 10) / 10
        }
      }).reverse()

      const mockAdoptionTrends: FeatureAdoption[] = Array.from({ length: 12 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (i * 7))
        
        return {
          week: date.toISOString().split('T')[0],
          clicks_adoption: Math.round((60 + Math.random() * 30) * 10) / 10,
          conversation_adoption: Math.round((30 + Math.random() * 20) * 10) / 10,
          match_adoption: Math.round((15 + Math.random() * 15) * 10) / 10
        }
      }).reverse()

      const mockDailyUsers: DailyUsers[] = Array.from({ length: timeRange === '60d' ? 60 : 90 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - ((timeRange === '60d' ? 59 : 89) - i))
        
        return {
          date: date.toISOString().split('T')[0],
          new_users: Math.floor(Math.random() * 100) + 50,
          returning_users: Math.floor(Math.random() * 300) + 150
        }
      })

      setStats(mockStats)
      setCohortData(mockCohortData)
      setAdoptionTrends(mockAdoptionTrends)
      setDailyUsers(mockDailyUsers)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch feature adoption data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdoptionData()
  }, [timeRange])

  const columns = [
    { 
      key: 'cohort_week', 
      label: 'Cohort Week',
      render: (value: string) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    },
    { key: 'new_users', label: 'New Users' },
    { key: 'wk1_retained', label: 'Week 1 Retained' },
    { key: 'wk4_retained', label: 'Week 4 Retained' },
    { 
      key: 'wk1_retention_rate', 
      label: 'Week 1 Rate (%)',
      render: (value: number) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value >= 40 ? 'bg-green-100 text-green-800' :
          value >= 25 ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {value}%
        </span>
      )
    },
    { 
      key: 'wk4_retention_rate', 
      label: 'Week 4 Rate (%)',
      render: (value: number) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value >= 20 ? 'bg-green-100 text-green-800' :
          value >= 10 ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {value}%
        </span>
      )
    },
    { 
      key: 'conv_rate', 
      label: 'Conv. Rate (%)',
      render: (value: number) => `${value}%`
    },
    { 
      key: 'match_rate', 
      label: 'Match Rate (%)',
      render: (value: number) => `${value}%`
    },
  ]

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} onRetry={fetchAdoptionData} />

  return (
    <div className="space-y-6">
      <div>
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
            Feature Adoption & Retention
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Monitor user retention, feature adoption, and cohort performance to drive growth
          </p>
        </div>
      </div>

      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setTimeRange('60d')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            timeRange === '60d'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Last 60 Days
        </button>
        <button
          onClick={() => setTimeRange('90d')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            timeRange === '90d'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Last 90 Days
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="New Users Today"
          value={stats?.new_users_today || 0}
          subtitle="First-time visitors"
          icon={Users}
        />
        <KPICard
          title="Returning Users Today"
          value={stats?.returning_users_today || 0}
          subtitle="Repeat visitors"
          icon={UserCheck}
        />
        <KPICard
          title="7-Day Retention"
          value={`${stats?.retention_7d || 0}%`}
          subtitle="Users returning in week 1"
          icon={Repeat}
        />
        <KPICard
          title="28-Day Retention"
          value={`${stats?.retention_28d || 0}%`}
          subtitle="Users returning in week 4"
          icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">New vs Returning Users</h2>
          <div className="space-y-3">
            {dailyUsers.slice(-14).map((day) => {
              const total = day.new_users + day.returning_users
              return (
                <div key={day.date} className="flex items-center space-x-4">
                  <div className="w-16 text-sm text-gray-600">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="flex-1">
                    <div className="flex h-6 rounded-lg overflow-hidden">
                      <div 
                        className="bg-blue-500" 
                        style={{ width: `${(day.new_users / total) * 100}%` }}
                        title={`New: ${day.new_users}`}
                      />
                      <div 
                        className="bg-green-500" 
                        style={{ width: `${(day.returning_users / total) * 100}%` }}
                        title={`Returning: ${day.returning_users}`}
                      />
                    </div>
                  </div>
                  <div className="w-12 text-sm text-gray-600 text-right">{total}</div>
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-center space-x-6 mt-4 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
              New Users
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
              Returning Users
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Feature Adoption Trends</h2>
          <div className="space-y-4">
            {adoptionTrends.slice(-8).map((week) => (
              <div key={week.week} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {new Date(week.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>Button Clicks</span>
                    <span>{week.clicks_adoption}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${week.clicks_adoption}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span>Conversations</span>
                    <span>{week.conversation_adoption}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${week.conversation_adoption}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span>Matches</span>
                    <span>{week.match_adoption}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ width: `${week.match_adoption}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Cohort Retention Heatmap</h2>
        <div className="overflow-x-auto">
          <div className="grid grid-cols-8 gap-2 min-w-full">
            <div className="text-xs font-medium text-gray-500 p-2">Cohort</div>
            <div className="text-xs font-medium text-gray-500 p-2">Users</div>
            <div className="text-xs font-medium text-gray-500 p-2">Week 1</div>
            <div className="text-xs font-medium text-gray-500 p-2">Week 4</div>
            <div className="text-xs font-medium text-gray-500 p-2">W1 Rate</div>
            <div className="text-xs font-medium text-gray-500 p-2">W4 Rate</div>
            <div className="text-xs font-medium text-gray-500 p-2">Conv</div>
            <div className="text-xs font-medium text-gray-500 p-2">Match</div>
            
            {cohortData.slice(0, 8).map((cohort) => (
              <React.Fragment key={cohort.cohort_week}>
                <div className="text-xs p-2 bg-gray-50">
                  {new Date(cohort.cohort_week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                <div className="text-xs p-2">{cohort.new_users}</div>
                <div className="text-xs p-2">{cohort.wk1_retained}</div>
                <div className="text-xs p-2">{cohort.wk4_retained}</div>
                <div className={`text-xs p-2 rounded ${
                  cohort.wk1_retention_rate >= 40 ? 'bg-green-100 text-green-800' :
                  cohort.wk1_retention_rate >= 25 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {cohort.wk1_retention_rate}%
                </div>
                <div className={`text-xs p-2 rounded ${
                  cohort.wk4_retention_rate >= 20 ? 'bg-green-100 text-green-800' :
                  cohort.wk4_retention_rate >= 10 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {cohort.wk4_retention_rate}%
                </div>
                <div className="text-xs p-2">{cohort.conv_rate}%</div>
                <div className="text-xs p-2">{cohort.match_rate}%</div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <SearchableTable
        data={cohortData}
        columns={columns}
        searchPlaceholder="Search cohorts..."
        exportFilename="feature_adoption_cohorts"
      />
    </div>
  )
}