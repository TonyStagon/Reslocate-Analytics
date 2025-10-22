import React, { useState, useEffect } from 'react'
import { Activity, Clock, AlertTriangle, Zap } from 'lucide-react'
import { KPICard } from '../components/KPICard'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorMessage } from '../components/ErrorMessage'
import { SearchableTable } from '../components/SearchableTable'
import { supabase } from '../lib/supabase'

// Types that match your Supabase session table schema
interface Session {
  session_id: string
  user_id: string
  start_time: string
  end_time: string | null
  status: string
}

interface SessionStats {
  active_sessions: number
  sessions_today: number
  avg_duration_7d: number
  crash_rate_7d: number
  disconnect_rate_7d: number
}

interface DailySessionData {
  date: string
  total_sessions: number
  completed: number
  active: number
  disconnected: number
  crashed: number
}

interface RecentSession {
  session_id: string
  user_id: string
  start_time: string
  end_time: string | null
  status: string
  duration_minutes: number
  first_name?: string
  last_name?: string
}

export function SessionHealth() {
  const [stats, setStats] = useState<SessionStats | null>(null)
  const [dailyData, setDailyData] = useState<DailySessionData[]>([])
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const calculateSessionDuration = (startTime: string, endTime: string | null): number => {
    if (!endTime) return 0
    const start = new Date(startTime)
    const end = new Date(endTime)
    return Math.round((end.getTime() - start.getTime()) / 60000) // minutes
  }

  const fetchSessionHealth = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch recent sessions (last 7 days)
      const today = new Date()
      const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

      // First fetch sessions
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .gte('start_time', sevenDaysAgo.toISOString())

      if (sessionError) throw sessionError
      if (!sessionData) return

      // Get unique user IDs from sessions to fetch profile data
      const userIds = [...new Set(sessionData.map(session => session.user_id))]
      
      // Fetch user profile data including first_name and last_name
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', userIds)

      if (profileError) console.warn('Failed to fetch profile data:', profileError)
      
      // Create a mapping of user_id to profile data for quick lookup
      const profileMap: Record<string, { first_name?: string; last_name?: string }> = {}
      if (profileData) {
        profileData.forEach(profile => {
          if (profile.user_id) {
            profileMap[profile.user_id] = {
              first_name: profile.first_name,
              last_name: profile.last_name
            }
          }
        })
      }
      console.log('📊 Session Analytics -', {
        totalSessions: sessionData.length,
        uniqueUsers: userIds.length,
        totalProfiles: profileData?.length || 0,
        sampleProfileData: profileData?.slice(0, 3)
      })

      // Process data for stats
      const sessions = sessionData as Session[]
      
      // Active sessions (without end_time)
      const activeSessions = sessions.filter(s => !s.end_time)
      
      // Sessions from today
      const sessionsToday = sessions.filter(s =>
        new Date(s.start_time).toDateString() === today.toDateString()
      )
      
      // Completed sessions (with end_time)
      const completedSessions = sessions.filter(s => {
        if (!s.end_time) return false
        const duration = calculateSessionDuration(s.start_time, s.end_time)
        return s.end_time && duration > 0
      })
      
      // Calculate average duration (from completed sessions)
      const avgDuration = completedSessions.length > 0
        ? completedSessions.reduce((sum, s) =>
            sum + calculateSessionDuration(s.start_time, s.end_time!), 0) / completedSessions.length
        : 0
      
      // Calculate crash/disconnect rates
      const crashedSessions = sessions.filter(s => s.status === 'crashed')
      const disconnectedSessions = sessions.filter(s => s.status === 'disconnected')
      const crashRate = completedSessions.length > 0
        ? (crashedSessions.length / completedSessions.length) * 100
        : 0
      const disconnectRate = completedSessions.length > 0
        ? (disconnectedSessions.length / completedSessions.length) * 100
        : 0

      // Build real-time stats
      const realStats: SessionStats = {
        active_sessions: activeSessions.length,
        sessions_today: sessionsToday.length,
        avg_duration_7d: Math.round(avgDuration * 10) / 10, // Round to 1 decimal
        crash_rate_7d: Math.round(crashRate * 10) / 10,
        disconnect_rate_7d: Math.round(disconnectRate * 10) / 10
      }

      // Build daily data
      const dailySessions: Record<string, DailySessionData> = {}
      sessions.forEach(session => {
        const date = new Date(session.start_time).toISOString().split('T')[0]
        if (!dailySessions[date]) {
          dailySessions[date] = {
            date,
            total_sessions: 0,
            completed: 0,
            active: 0,
            disconnected: 0,
            crashed: 0
          }
        }
        
        dailySessions[date].total_sessions++
        
        if (!session.end_time) {
          dailySessions[date].active++
        } else if (session.status === 'completed') {
          dailySessions[date].completed++
        } else if (session.status === 'disconnected') {
          dailySessions[date].disconnected++
        } else if (session.status === 'crashed') {
          dailySessions[date].crashed++
        }
      })

      // Sort daily data chronologically and get last 7 days
      const sortedDaily = Object.values(dailySessions)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-7)

      // Prepare recent sessions for table
      const recent = sessions
        .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
        .slice(0, 50)
        .map(session => {
          const userProfile = profileMap[session.user_id]
          return {
            session_id: session.session_id,
            user_id: session.user_id,
            start_time: session.start_time,
            end_time: session.end_time,
            status: session.status,
            duration_minutes: calculateSessionDuration(session.start_time, session.end_time),
            first_name: userProfile?.first_name,
            last_name: userProfile?.last_name
          }
        })

      setStats(realStats)
      setDailyData(sortedDaily)
      setRecentSessions(recent)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch session health data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessionHealth()
  }, [])

  const columns = [
    { key: 'session_id', label: 'Session ID' },
    { key: 'user_id', label: 'User ID' },
    {
      key: 'user_name',
      label: 'User Name',
      render: (_value: string, row: RecentSession) => {
        const fullName = `${row.first_name || ''} ${row.last_name || ''}`.trim()
        if (fullName && fullName !== ' ') {
          return fullName
        }
        return <span className="text-gray-400">Unnamed User</span>
      }
    },
    {
      key: 'start_time',
      label: 'Start Time',
      render: (value: string) => {
        const date = new Date(value)
        // Preserve UTC time as stored in database
        return date.toLocaleString('en-US', {
          timeZone: 'UTC',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
      }
    },
    {
      key: 'end_time',
      label: 'End Time',
      render: (value: string | null) => value ? new Date(value).toLocaleString('en-US', {
        timeZone: 'UTC',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }) : 'Active'
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'completed' ? 'bg-green-100 text-green-800' :
          value === 'active' ? 'bg-blue-100 text-blue-800' :
          value === 'disconnected' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {value}
        </span>
      )
    },
    { 
      key: 'duration_minutes', 
      label: 'Duration (min)',
      render: (value: number) => value > 0 ? value.toString() : '-'
    },
  ]

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} onRetry={fetchSessionHealth} />

  return (
    <div className="space-y-6">
      <div>
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
            Session Health Overview
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Monitor active sessions, performance metrics, and system health in real-time
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <KPICard
          title="Active Sessions"
          value={stats?.active_sessions || 0}
          subtitle="Currently active"
          icon={Activity}
        />
        <KPICard
          title="Sessions Today"
          value={stats?.sessions_today || 0}
          subtitle="Started today"
          icon={Zap}
        />
        <KPICard
          title="Avg Duration"
          value={`${stats?.avg_duration_7d || 0}m`}
          subtitle="Last 7 days"
          icon={Clock}
        />
        <KPICard
          title="Crash Rate"
          value={`${stats?.crash_rate_7d || 0}%`}
          subtitle="Last 7 days"
          icon={AlertTriangle}
        />
        <KPICard
          title="Disconnect Rate"
          value={`${stats?.disconnect_rate_7d || 0}%`}
          subtitle="Last 7 days"
          icon={AlertTriangle}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Activity className="h-5 w-5 mr-2 text-green-600" />
            Daily Sessions by Status (Last 7 Days)
          </h2>
          <div className="space-y-3">
            {dailyData.map((day, index) => {
              const total = day.completed + day.active + day.disconnected + day.crashed
              return (
                <div key={day.date} className="flex items-center space-x-4">
                  <div className="w-16 text-sm font-medium text-gray-700">
                    {new Date(day.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: '2-digit'
                    })}
                  </div>
                  <div className="flex-1">
                    <div className="flex h-6 rounded-lg overflow-hidden shadow-inner">
                      <div
                        className="bg-gradient-to-r from-green-400 to-green-500 transition-all duration-300"
                        style={{
                          width: `${total > 0 ? (day.completed / total) * 100 : 0}%`,
                          minHeight: '100%'
                        }}
                        title={`Completed: ${day.completed}`}
                      />
                      <div
                        className="bg-gradient-to-r from-blue-400 to-blue-500 transition-all duration-300"
                        style={{
                          width: `${total > 0 ? (day.active / total) * 100 : 0}%`,
                          minHeight: '100%'
                        }}
                        title={`Active: ${day.active}`}
                      />
                      <div
                        className="bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all duration-300"
                        style={{
                          width: `${total > 0 ? (day.disconnected / total) * 100 : 0}%`,
                          minHeight: '100%'
                        }}
                        title={`Disconnected: ${day.disconnected}`}
                      />
                      <div
                        className="bg-gradient-to-r from-red-400 to-red-500 transition-all duration-300"
                        style={{
                          width: `${total > 0 ? (day.crashed / total) * 100 : 0}%`,
                          minHeight: '100%'
                        }}
                        title={`Crashed: ${day.crashed}`}
                      />
                    </div>
                  </div>
                  <div className="w-12 text-sm font-semibold text-gray-700 text-right">{total}</div>
                </div>
              )
            })}
            {dailyData.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <Activity className="mx-auto h-12 w-12 mb-2 opacity-50" />
                <p>No session data available for the selected period</p>
              </div>
            )}
          </div>
          <div className="flex items-center justify-center space-x-6 mt-6 text-sm font-medium">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-green-500 rounded mr-2 shadow-sm"></div>
              Completed
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-blue-500 rounded mr-2 shadow-sm"></div>
              Active
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded mr-2 shadow-sm"></div>
              Disconnected
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gradient-to-r from-red-400 to-red-500 rounded mr-2 shadow-sm"></div>
              Crashed
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-green-600" />
            Session Duration Distribution (Last 7 Days)
          </h2>
          <div className="space-y-3">
            {(() => {
              // Calculate duration distribution from real data
              const completedWithDuration = recentSessions.filter(s => s.duration_minutes > 0)
              const durationBuckets = [
                { range: '0-5 min', min: 0, max: 5 },
                { range: '5-15 min', min: 5, max: 15 },
                { range: '15-30 min', min: 15, max: 30 },
                { range: '30-60 min', min: 30, max: 60 },
                { range: '60+ min', min: 60, max: Infinity }
              ]
              
              const counts = durationBuckets.map(bucket => ({
                range: bucket.range,
                count: completedWithDuration.filter(s =>
                  s.duration_minutes > bucket.min && s.duration_minutes <= bucket.max
                ).length
              }))
              
              const totalCompleted = counts.reduce((sum, bucket) => sum + bucket.count, 0)
              
              return counts.map(bucket => ({
                ...bucket,
                percentage: totalCompleted > 0 ? Math.round((bucket.count / totalCompleted) * 100) : 0
              })).map(bucket => (
                <div key={bucket.range} className="flex items-center space-x-4">
                  <div className="w-20 text-sm font-medium text-gray-700">{bucket.range}</div>
                  <div className="flex-1">
                    <div className="bg-gray-200 rounded-full h-4 shadow-inner">
                      <div
                        className="bg-gradient-to-r from-green-500 to-green-600 h-4 rounded-full transition-all duration-500 shadow-sm"
                        style={{ width: `${bucket.percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-16 text-sm font-semibold text-gray-700 text-right">
                    {bucket.count > 0 ? bucket.count : '0'}
                  </div>
                </div>
              ))
            })()}
            {recentSessions.filter(s => s.duration_minutes > 0).length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <Clock className="mx-auto h-12 w-12 mb-2 opacity-50" />
                <p>No completed sessions with duration data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <SearchableTable
        data={recentSessions}
        columns={columns}
        searchPlaceholder="Search sessions by ID or user..."
        exportFilename="recent_sessions"
      />
    </div>
  )
}