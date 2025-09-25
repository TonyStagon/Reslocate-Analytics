import React, { useState, useEffect } from 'react'
import { Activity, Clock, AlertTriangle, Zap } from 'lucide-react'
import { KPICard } from '../components/KPICard'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorMessage } from '../components/ErrorMessage'
import { SearchableTable } from '../components/SearchableTable'
import { supabase } from '../lib/supabase'

interface SessionHealthStats {
  active_sessions: number
  sessions_today: number
  avg_duration_7d: number
  crash_rate_7d: number
  disconnect_rate_7d: number
}

interface DailySessionData {
  date: string
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
}

export function SessionHealth() {
  const [stats, setStats] = useState<SessionHealthStats | null>(null)
  const [dailyData, setDailyData] = useState<DailySessionData[]>([])
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSessionHealth = async () => {
    try {
      setLoading(true)
      setError(null)

      // Mock data - replace with actual Supabase queries
      const mockStats: SessionHealthStats = {
        active_sessions: 127,
        sessions_today: 1543,
        avg_duration_7d: 18.5,
        crash_rate_7d: 2.3,
        disconnect_rate_7d: 8.7
      }

      const mockDailyData: DailySessionData[] = Array.from({ length: 30 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (29 - i))
        return {
          date: date.toISOString().split('T')[0],
          completed: Math.floor(Math.random() * 500) + 200,
          active: Math.floor(Math.random() * 50) + 10,
          disconnected: Math.floor(Math.random() * 80) + 20,
          crashed: Math.floor(Math.random() * 30) + 5
        }
      })

      const mockRecentSessions: RecentSession[] = Array.from({ length: 20 }, (_, i) => {
        const startTime = new Date()
        startTime.setHours(startTime.getHours() - Math.floor(Math.random() * 24))
        const endTime = Math.random() > 0.2 ? new Date(startTime.getTime() + Math.random() * 3600000) : null
        const status = endTime ? ['completed', 'disconnected', 'crashed'][Math.floor(Math.random() * 3)] : 'active'
        
        return {
          session_id: `sess_${Math.random().toString(36).substr(2, 9)}`,
          user_id: `user_${Math.random().toString(36).substr(2, 9)}`,
          start_time: startTime.toISOString(),
          end_time: endTime?.toISOString() || null,
          status,
          duration_minutes: endTime ? Math.round((endTime.getTime() - startTime.getTime()) / 60000) : 0
        }
      })

      setStats(mockStats)
      setDailyData(mockDailyData)
      setRecentSessions(mockRecentSessions)
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
      key: 'start_time', 
      label: 'Start Time',
      render: (value: string) => new Date(value).toLocaleString()
    },
    { 
      key: 'end_time', 
      label: 'End Time',
      render: (value: string | null) => value ? new Date(value).toLocaleString() : 'Active'
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
            Daily Sessions by Status (Last 30 Days)
          </h2>
          <div className="space-y-3">
            {dailyData.slice(-7).map((day, index) => {
              const total = day.completed + day.active + day.disconnected + day.crashed
              return (
                <div key={day.date} className="flex items-center space-x-4">
                  <div className="w-16 text-sm font-medium text-gray-700">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="flex-1">
                    <div className="flex h-6 rounded-lg overflow-hidden shadow-inner">
                      <div 
                        className="bg-gradient-to-r from-green-400 to-green-500" 
                        style={{ width: `${(day.completed / total) * 100}%` }}
                        title={`Completed: ${day.completed}`}
                      />
                      <div 
                        className="bg-gradient-to-r from-blue-400 to-blue-500" 
                        style={{ width: `${(day.active / total) * 100}%` }}
                        title={`Active: ${day.active}`}
                      />
                      <div 
                        className="bg-gradient-to-r from-yellow-400 to-yellow-500" 
                        style={{ width: `${(day.disconnected / total) * 100}%` }}
                        title={`Disconnected: ${day.disconnected}`}
                      />
                      <div 
                        className="bg-gradient-to-r from-red-400 to-red-500" 
                        style={{ width: `${(day.crashed / total) * 100}%` }}
                        title={`Crashed: ${day.crashed}`}
                      />
                    </div>
                  </div>
                  <div className="w-12 text-sm font-semibold text-gray-700 text-right">{total}</div>
                </div>
              )
            })}
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
            {[
              { range: '0-5 min', count: 234, percentage: 15 },
              { range: '5-15 min', count: 567, percentage: 35 },
              { range: '15-30 min', count: 432, percentage: 27 },
              { range: '30-60 min', count: 298, percentage: 18 },
              { range: '60+ min', count: 89, percentage: 5 }
            ].map((bucket) => (
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
                <div className="w-16 text-sm font-semibold text-gray-700 text-right">{bucket.count}</div>
              </div>
            ))}
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