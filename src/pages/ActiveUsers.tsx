import React, { useState, useEffect } from 'react'
import { Users, TrendingUp, Calendar, Clock, UserCheck, Baby } from 'lucide-react'
import { KPICard } from '../components/KPICard'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorMessage } from '../components/ErrorMessage'
import { supabase } from '../lib/supabase'

interface SessionData {
  session_id: string
  user_id: string
  start_time: string
  profiles: {
    id: string
    is_parent: boolean | null
  }[]
}

interface ActiveUserStats {
  total_active_users: number
  total_learners: number
  total_parents: number
  dau_total: number
  dau_learners: number
  dau_parents: number
  wau_total: number
  wau_learners: number
  wau_parents: number
  mau_total: number
  mau_learners: number
  mau_parents: number
}

interface TrendData {
  date: string
  learners: number
  parents: number
  total: number
}

export function ActiveUsers() {
  const [stats, setStats] = useState<ActiveUserStats | null>(null)
  const [dailyTrends, setDailyTrends] = useState<TrendData[]>([])
  const [weeklyTrends, setWeeklyTrends] = useState<TrendData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchActiveUserStats = async () => {
    try {
      setLoading(true)
      setError(null)

      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

      // Fetch all sessions from last 30 days with user profiles (use role instead of is_parent)
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select(`
          session_id,
          user_id,
          start_time,
          profiles(id, is_parent)
        `)
        .gte('start_time', thirtyDaysAgo.toISOString())

      if (sessionsError) throw sessionsError

      // Process sessions to get unique users per time period
      const sessions = (sessionsData || []) as SessionData[]
      
      // Helper to get unique users by period
      const getUniqueUsers = (startDate: Date, userType?: 'Parent') => {
        const filtered = sessions.filter(s => {
          const sessionDate = new Date(s.start_time)
          const matchesDate = sessionDate >= startDate
          // Filter by user type (Parent or others which are Learners)
          const isParent = s.profiles[0]?.is_parent === true
          const matchesUserType = userType === undefined ||
            (userType === 'Parent' ? isParent : !isParent)
          return matchesDate && matchesUserType
        })
        return new Set(filtered.map(s => s.user_id)).size
      }

      // Calculate DAU (today)
     const dau_total = getUniqueUsers(today)
     // For calculations, we treat all users that are NOT parents as learners
     const dau_parents = getUniqueUsers(today, 'Parent')
     const dau_learners = dau_total - dau_parents

      // Calculate WAU (last 7 days)
     const wau_total = getUniqueUsers(sevenDaysAgo)
     const wau_parents = getUniqueUsers(sevenDaysAgo, 'Parent')
     const wau_learners = wau_total - wau_parents

      // Calculate MAU (last 30 days)
     const mau_total = getUniqueUsers(thirtyDaysAgo)
     const mau_parents = getUniqueUsers(thirtyDaysAgo, 'Parent')
     const mau_learners = mau_total - mau_parents

      // Build daily trends for last 7 days
      const daily: TrendData[] = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
        const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000)
        
        const daySessions = sessions.filter(s => {
          const sessionDate = new Date(s.start_time)
          return sessionDate >= date && sessionDate < nextDate
        })
        
        const parentUsers = new Set(
          daySessions.filter(s => s.profiles[0]?.is_parent === true).map(s => s.user_id)
        )
        const learnerUsers = new Set(
          daySessions.filter(s => s.profiles[0] && (s.profiles[0]?.is_parent === false || s.profiles[0]?.is_parent === null)).map(s => s.user_id)
        )
        
        daily.push({
          date: date.toISOString().split('T')[0],
          learners: learnerUsers.size,
          parents: parentUsers.size,
          total: learnerUsers.size + parentUsers.size
        })
      }

      // Build weekly trends for last 4 weeks
      const weekly: TrendData[] = []
      for (let i = 3; i >= 0; i--) {
        const weekEnd = new Date(today.getTime() - i * 7 * 24 * 60 * 60 * 1000)
        const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000)
        
        const weekSessions = sessions.filter(s => {
          const sessionDate = new Date(s.start_time)
          return sessionDate >= weekStart && sessionDate < weekEnd
        })
        
        const parentUsers = new Set(
          weekSessions.filter(s => s.profiles[0]?.is_parent === true).map(s => s.user_id)
        )
        const learnerUsers = new Set(
          weekSessions.filter(s => s.profiles[0] && (s.profiles[0]?.is_parent === false || s.profiles[0]?.is_parent === null)).map(s => s.user_id)
        )
        
        weekly.push({
          date: weekStart.toISOString().split('T')[0],
          learners: learnerUsers.size,
          parents: parentUsers.size,
          total: learnerUsers.size + parentUsers.size
        })
      }

      setStats({
        total_active_users: mau_total,
        total_learners: mau_learners,
        total_parents: mau_parents,
        dau_total,
        dau_learners,
        dau_parents,
        wau_total,
        wau_learners,
        wau_parents,
        mau_total,
        mau_learners,
        mau_parents
      })
      setDailyTrends(daily)
      setWeeklyTrends(weekly)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load active user statistics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActiveUserStats()
  }, [])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} onRetry={fetchActiveUserStats} />
  if (!stats) return null

  // Calculate engagement ratios
  const dauMauRatio = stats.mau_total > 0 ? ((stats.dau_total / stats.mau_total) * 100).toFixed(1) : '0'
  const wauMauRatio = stats.mau_total > 0 ? ((stats.wau_total / stats.mau_total) * 100).toFixed(1) : '0'
  const parentRatio = stats.total_active_users > 0 ? ((stats.total_parents / stats.total_active_users) * 100).toFixed(1) : '0'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-700 to-green-600 bg-clip-text text-transparent mb-3">
          Active Users Overview
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Track learner and parent engagement across daily, weekly, and monthly timeframes
        </p>
      </div>

      {/* Total Active Users */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Total Active Users (Last 30 Days)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KPICard
            title="All Users"
            value={stats.total_active_users.toLocaleString()}
            subtitle="Unique active users (MAU)"
            icon={Users}
          />
          <KPICard
            title="Learners"
            value={stats.total_learners.toLocaleString()}
            subtitle={`${((stats.total_learners / stats.total_active_users) * 100).toFixed(1)}% of total`}
            icon={UserCheck}
          />
          <KPICard
            title="Parents"
            value={stats.total_parents.toLocaleString()}
            subtitle={`${parentRatio}% of total`}
            icon={Baby}
          />
        </div>
      </div>

      {/* Daily Active Users */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Daily Active Users (Today)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KPICard
            title="DAU Total"
            value={stats.dau_total.toLocaleString()}
            subtitle={`${dauMauRatio}% of MAU`}
            icon={Clock}
          />
          <KPICard
            title="Learners"
            value={stats.dau_learners.toLocaleString()}
            subtitle={`${stats.dau_total > 0 ? ((stats.dau_learners / stats.dau_total) * 100).toFixed(1) : '0'}% of DAU`}
            icon={UserCheck}
          />
          <KPICard
            title="Parents"
            value={stats.dau_parents.toLocaleString()}
            subtitle={`${stats.dau_total > 0 ? ((stats.dau_parents / stats.dau_total) * 100).toFixed(1) : '0'}% of DAU`}
            icon={Baby}
          />
        </div>
      </div>

      {/* Weekly Active Users */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Weekly Active Users (Last 7 Days)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KPICard
            title="WAU Total"
            value={stats.wau_total.toLocaleString()}
            subtitle={`${wauMauRatio}% of MAU`}
            icon={Calendar}
          />
          <KPICard
            title="Learners"
            value={stats.wau_learners.toLocaleString()}
            subtitle={`${stats.wau_total > 0 ? ((stats.wau_learners / stats.wau_total) * 100).toFixed(1) : '0'}% of WAU`}
            icon={UserCheck}
          />
          <KPICard
            title="Parents"
            value={stats.wau_parents.toLocaleString()}
            subtitle={`${stats.wau_total > 0 ? ((stats.wau_parents / stats.wau_total) * 100).toFixed(1) : '0'}% of WAU`}
            icon={Baby}
          />
        </div>
      </div>

      {/* Monthly Active Users */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Monthly Active Users (Last 30 Days)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KPICard
            title="MAU Total"
            value={stats.mau_total.toLocaleString()}
            subtitle="Rolling 30-day window"
            icon={TrendingUp}
          />
          <KPICard
            title="Learners"
            value={stats.mau_learners.toLocaleString()}
            subtitle={`${stats.mau_total > 0 ? ((stats.mau_learners / stats.mau_total) * 100).toFixed(1) : '0'}% of MAU`}
            icon={UserCheck}
          />
          <KPICard
            title="Parents"
            value={stats.mau_parents.toLocaleString()}
            subtitle={`${stats.mau_total > 0 ? ((stats.mau_parents / stats.mau_total) * 100).toFixed(1) : '0'}% of MAU`}
            icon={Baby}
          />
        </div>
      </div>

      {/* Trends Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Trends */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-green-600" />
            Daily Active Users (Last 7 Days)
          </h2>
          <div className="space-y-3">
            {dailyTrends.map((day) => {
              const maxValue = Math.max(...dailyTrends.map(d => d.total), 1)
              return (
                <div key={day.date} className="flex items-center space-x-4">
                  <div className="w-16 text-sm font-medium text-gray-700">
                    {new Date(day.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: '2-digit'
                    })}
                  </div>
                  <div className="flex-1">
                    <div className="flex h-8 rounded-lg overflow-hidden shadow-inner">
                      <div
                        className="bg-gradient-to-r from-blue-400 to-blue-500 flex items-center justify-center text-xs text-white font-semibold"
                        style={{
                          width: `${(day.learners / maxValue) * 100}%`,
                          minWidth: day.learners > 0 ? '30px' : '0'
                        }}
                        title={`Learners: ${day.learners}`}
                      >
                        {day.learners > 0 ? day.learners : ''}
                      </div>
                      <div
                        className="bg-gradient-to-r from-purple-400 to-purple-500 flex items-center justify-center text-xs text-white font-semibold"
                        style={{
                          width: `${(day.parents / maxValue) * 100}%`,
                          minWidth: day.parents > 0 ? '30px' : '0'
                        }}
                        title={`Parents: ${day.parents}`}
                      >
                        {day.parents > 0 ? day.parents : ''}
                      </div>
                    </div>
                  </div>
                  <div className="w-12 text-sm font-semibold text-gray-700 text-right">
                    {day.total}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-center space-x-6 mt-6 text-sm font-medium">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-blue-500 rounded mr-2"></div>
              Learners
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-purple-500 rounded mr-2"></div>
              Parents
            </div>
          </div>
        </div>

        {/* Weekly Trends */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-green-600" />
            Weekly Active Users (Last 4 Weeks)
          </h2>
          <div className="space-y-3">
            {weeklyTrends.map((week, index) => {
              const maxValue = Math.max(...weeklyTrends.map(w => w.total), 1)
              return (
                <div key={week.date} className="flex items-center space-x-4">
                  <div className="w-16 text-sm font-medium text-gray-700">
                    Week {4 - index}
                  </div>
                  <div className="flex-1">
                    <div className="flex h-8 rounded-lg overflow-hidden shadow-inner">
                      <div
                        className="bg-gradient-to-r from-green-400 to-green-500 flex items-center justify-center text-xs text-white font-semibold"
                        style={{
                          width: `${(week.learners / maxValue) * 100}%`,
                          minWidth: week.learners > 0 ? '30px' : '0'
                        }}
                        title={`Learners: ${week.learners}`}
                      >
                        {week.learners > 0 ? week.learners : ''}
                      </div>
                      <div
                        className="bg-gradient-to-r from-orange-400 to-orange-500 flex items-center justify-center text-xs text-white font-semibold"
                        style={{
                          width: `${(week.parents / maxValue) * 100}%`,
                          minWidth: week.parents > 0 ? '30px' : '0'
                        }}
                        title={`Parents: ${week.parents}`}
                      >
                        {week.parents > 0 ? week.parents : ''}
                      </div>
                    </div>
                  </div>
                  <div className="w-12 text-sm font-semibold text-gray-700 text-right">
                    {week.total}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-center space-x-6 mt-6 text-sm font-medium">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-green-500 rounded mr-2"></div>
              Learners
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gradient-to-r from-orange-400 to-orange-500 rounded mr-2"></div>
              Parents
            </div>
          </div>
        </div>
      </div>

      {/* Key Insights */}
      <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl shadow-lg border border-green-100 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
          Key Insights & Trends
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-2">Engagement Ratios</h3>
            <ul className="space-y-2 text-gray-700">
              <li>• <strong>DAU/MAU:</strong> {dauMauRatio}% (daily stickiness)</li>
              <li>• <strong>WAU/MAU:</strong> {wauMauRatio}% (weekly stickiness)</li>
              <li>• <strong>Parent Ratio:</strong> {parentRatio}% of all users</li>
            </ul>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-2">User Distribution</h3>
            <ul className="space-y-2 text-gray-700">
              <li>• <strong>Learners:</strong> {stats.total_active_users > 0 ? ((stats.total_learners / stats.total_active_users) * 100).toFixed(1) : '0'}% of MAU</li>
              <li>• <strong>Parents:</strong> {parentRatio}% of MAU</li>
              <li>• <strong>L:P Ratio:</strong> {stats.total_parents > 0 ? (stats.total_learners / stats.total_parents).toFixed(1) : 'N/A'}:1</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}