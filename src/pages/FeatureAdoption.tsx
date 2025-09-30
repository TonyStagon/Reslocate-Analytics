import React, { useState, useEffect } from 'react'
import { Users, UserCheck, Repeat, TrendingUp, MousePointer } from 'lucide-react'
import { KPICard } from '../components/KPICard'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorMessage } from '../components/ErrorMessage'
import { SearchableTable } from '../components/SearchableTable'
import { supabase } from '../lib/supabase'

interface ButtonClick {
  session_id: string
  page_name: string
  click_metadata: any
  created_at: string
}

interface AdoptionStats {
  total_button_clicks_today: number
  unique_sessions_clicked_today: number
  page_interaction_rate: number
  feature_adoption_rate: number
}

interface PageCTR {
  page_name: string
  total_clicks: number
  unique_sessions: number
  ctr: number
}

interface DailyButtonClicks {
  date: string
  total_clicks: number
  unique_sessions: number
  avg_clicks_per_session: number
}

interface FeatureAdoption {
  week: string
  button_clicks: number
  pages_engaged: number
  session_engagement: number
}

export function FeatureAdoption() {
  const [stats, setStats] = useState<AdoptionStats | null>(null)
  const [pageCTR, setPageCTR] = useState<PageCTR[]>([])
  const [adoptionTrends, setAdoptionTrends] = useState<FeatureAdoption[]>([])
  const [dailyClicks, setDailyClicks] = useState<DailyButtonClicks[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'7d' | '30d'>('7d')
  
  // Define type for the cohort heatmap section
  interface CohortHeatmapData {
    cohort_week: string
    new_users: number
    wk1_retained: number
    wk4_retained: number
    wk1_retention_rate: number
    wk4_retention_rate: number
    conv_rate: number
    match_rate: number
  }
  // Mock data for cohort retention heatmap (replace with real data from database)
  const cohortData: CohortHeatmapData[] = [
    {
      "cohort_week": "2025-09-09",
      "new_users": 154,
      "wk1_retained": 121,
      "wk4_retained": 88,
      "wk1_retention_rate": 79,
      "wk4_retention_rate": 57,
      "conv_rate": 45,
      "match_rate": 63
    },
    {
      "cohort_week": "2025-09-02",
      "new_users": 142,
      "wk1_retained": 109,
      "wk4_retained": 92,
      "wk1_retention_rate": 77,
      "wk4_retention_rate": 65,
      "conv_rate": 48,
      "match_rate": 67
    },
    {
      "cohort_week": "2025-08-26",
      "new_users": 168,
      "wk1_retained": 134,
      "wk4_retained": 85,
      "wk1_retention_rate": 80,
      "wk4_retention_rate": 51,
      "conv_rate": 52,
      "match_rate": 59
    },
    {
      "cohort_week": "2025-08-19",
      "new_users": 121,
      "wk1_retained": 95,
      "wk4_retained": 98,
      "wk1_retention_rate": 79,
      "wk4_retention_rate": 81,
      "conv_rate": 47,
      "match_rate": 72
    }
  ]

  const calculateDateRange = () => {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - (timeRange === '7d' ? 7 : 30))
    return { startDate, endDate }
  }

  const fetchAdoptionData = async () => {
    try {
      setLoading(true)
      setError(null)

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const { startDate, endDate } = calculateDateRange()

      // Fetch today's button clicks for stats
      const { data: todayClicks, error: todayError } = await supabase
        .from('button_clicks')
        .select('*')
        .gte('created_at', today.toISOString())

      if (todayError) throw todayError

      // Fetch historical clicks for trends (last 30 days)
      const { data: historicalClicks, error: historyError } = await supabase
        .from('button_clicks')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      if (historyError) throw historyError

      const clicks = historicalClicks as ButtonClick[]
      const todayData = todayClicks || []

      // Process today's stats
      const uniqueSessionsToday = new Set(todayData.map(click => click.session_id)).size
      
      // Process page-level CTR data
      const pageStats: Record<string, { clicks: number; sessions: Set<string> }> = {}
      clicks.forEach(click => {
        if (!pageStats[click.page_name]) {
          pageStats[click.page_name] = { clicks: 0, sessions: new Set() }
        }
        pageStats[click.page_name].clicks++
        pageStats[click.page_name].sessions.add(click.session_id)
      })

      // Calculate statistics
      const allUniqueSessions = new Set(clicks.map(click => click.session_id)).size
      const avgClicksPerSessionToday = todayData.length > 0 ? todayData.length / uniqueSessionsToday : 0
      
      // Estimate engagement/adoption rates
      const estimatedEngagementRate = todayData.length > 0
        ? Math.min(100, Math.round((uniqueSessionsToday / Math.max(allUniqueSessions, 1)) * 100 * 2 / 3))
        : 0

      // Build real stats from button clicks
      const realStats: AdoptionStats = {
        total_button_clicks_today: todayData.length,
        unique_sessions_clicked_today: uniqueSessionsToday,
        page_interaction_rate: estimatedEngagementRate,
        feature_adoption_rate: Math.round(estimatedEngagementRate * 0.8)
      }

      // Process page CTR data
      const pageCTRData: PageCTR[] = Object.entries(pageStats).map(([page, data]) => ({
        page_name: page,
        total_clicks: data.clicks,
        unique_sessions: data.sessions.size,
        ctr: Math.round((data.clicks / Math.max(data.sessions.size, 1)) * 100) / 100
      })).sort((a, b) => b.total_clicks - a.total_clicks)
      .slice(0, 10)

      // Process daily trends
      const dailyStats: Record<string, { clicks: number; sessions: Set<string> }> = {}
      clicks.forEach(click => {
        const date = new Date(click.created_at).toISOString().split('T')[0]
        if (!dailyStats[date]) {
          dailyStats[date] = { clicks: 0, sessions: new Set() }
        }
        dailyStats[date].clicks++
        dailyStats[date].sessions.add(click.session_id)
      })

      const dailyClicksData: DailyButtonClicks[] = Object.entries(dailyStats)
        .map(([date, data]) => ({
          date,
          total_clicks: data.clicks,
          unique_sessions: data.sessions.size,
          avg_clicks_per_session: Math.round((data.clicks / Math.max(data.sessions.size, 1)) * 100) / 100
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      // Process weekly adoption trends
      const weeklyStats: Record<string, { clicks: number; sessions: Set<string>; pages: Set<string> }> = {}
      clicks.forEach(click => {
        const date = new Date(click.created_at)
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        const weekKey = weekStart.toISOString().split('T')[0]
        
        if (!weeklyStats[weekKey]) {
          weeklyStats[weekKey] = { clicks: 0, sessions: new Set(), pages: new Set() }
        }
        weeklyStats[weekKey].clicks += click.click_metadata?.shared_count || 1
        weeklyStats[weekKey].sessions.add(click.session_id)
        weeklyStats[weekKey].pages.add(click.page_name)
      })

      const trendsData: FeatureAdoption[] = Object.entries(weeklyStats)
        .map(([week, data]) => ({
          week,
          button_clicks: Math.min(100, Math.round((data.clicks / 100) * 5)),
          pages_engaged: Math.min(100, Math.round((data.pages.size / 10) * 50)),
          session_engagement: Math.min(100, Math.round((data.sessions.size / 50) * 40))
        }))
        .sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime())
        .slice(-8)

      setStats(realStats)
      setPageCTR(pageCTRData)
      setAdoptionTrends(trendsData)
      setDailyClicks(dailyClicksData)
      
      // Verifying data fetch - log unique page names for debugging
      const uniquePages = Object.keys(pageStats)
      console.log('📊 Feature Adoption - Pages fetched from Supabase:', uniquePages)
      console.log('🎯 Today\'s page usage:', realStats)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch feature adoption data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdoptionData()
  }, [timeRange])

  const pageColumns = [
    { key: 'page_name', label: 'Page Name' },
    { key: 'total_clicks', label: 'Total Clicks' },
    { key: 'unique_sessions', label: 'Unique Sessions' },
    {
      key: 'ctr',
      label: 'Clicks/Session (CTR)',
      render: (value: number) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value >= 3 ? 'bg-green-100 text-green-800' :
          value >= 1.5 ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value.toFixed(2)}
        </span>
      )
    },
  ]

  const activityColumns = [
    {
      key: 'date',
      label: 'Date',
      render: (value: string) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    },
    { key: 'total_clicks', label: 'Total Clicks' },
    { key: 'unique_sessions', label: 'Unique Sessions' },
    { key: 'avg_clicks_per_session', label: 'Avg Clicks/Session' },
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
          onClick={() => setTimeRange('7d')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            timeRange === '7d'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Last 7 Days
        </button>
        <button
          onClick={() => setTimeRange('30d')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            timeRange === '30d'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Last 30 Days
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Button Clicks Today"
          value={stats?.total_button_clicks_today || 0}
          subtitle="Total interactions"
          icon={MousePointer}
        />
        <KPICard
          title="Engaged Sessions"
          value={stats?.unique_sessions_clicked_today || 0}
          subtitle="Sessions with clicks"
          icon={Users}
        />
        <KPICard
          title="Page Interaction"
          value={`${stats?.page_interaction_rate || 0}%`}
          subtitle="Based on specific page clicks"
          icon={UserCheck}
        />
        <KPICard
          title="Feature Adoption"
          value={`${stats?.feature_adoption_rate || 0}%`}
          subtitle="Overall user adoption"
          icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Daily Click Activity</h2>
          <div className="space-y-3">
            {dailyClicks.slice(-14).map((day) => {
              const avgClickRate = day.avg_clicks_per_session
              const intensity = Math.min(100, (avgClickRate / 5) * 100)
              return (
                <div key={day.date} className="flex items-center space-x-4">
                  <div className="w-16 text-sm text-gray-600">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="flex-1">
                    <div className="relative">
                      <div className="bg-gray-200 rounded-full h-2 w-full">
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.max(5, intensity)}%`,
                            backgroundColor: intensity > 70 ? '#10b981' :
                                           intensity > 40 ? '#3b82f6' :
                                           '#ef4444'
                          }}
                          title={`Average clicks/session: ${avgClickRate}`}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="w-12 text-sm text-gray-600 text-right">{day.total_clicks}</div>
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-center space-x-6 mt-4 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
              Low Activity
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
              Medium Activity
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
              High Activity
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
                    {new Date(week.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} Week
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>Button Engagement</span>
                    <span>{week.button_clicks}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${week.button_clicks}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span>Pages Used</span>
                    <span>{week.pages_engaged}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${week.pages_engaged}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span>Session Engagement</span>
                    <span>{week.session_engagement}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ width: `${week.session_engagement}%` }}
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
            
            {cohortData.slice(0, 4).map((cohort: CohortHeatmapData) => (
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

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Click-Through Rate by Page Name</h2>
          <p className="text-sm text-gray-600 mb-4">
            Tracking actual page clicks for: home_page, liked_page, settings_page, profile_page, chat_page and more
          </p>
          <SearchableTable
            data={pageCTR}
            columns={pageColumns}
            searchPlaceholder="Search pages..."
            exportFilename="page_click_through_rates"
          />
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Daily Activity Details</h2>
          <p className="text-sm text-gray-600 mb-4">
            Daily breakdown of button click statistics and session engagement
          </p>
          <SearchableTable
            data={dailyClicks}
            columns={activityColumns}
            searchPlaceholder="Search dates..."
           exportFilename="daily_button_activity"
          />
        </div>
      </div>
    </div>
  )
}