import React, { useState, useEffect } from 'react'
import { Users, TrendingUp, Award, GraduationCap } from 'lucide-react'
import { KPICard } from '../components/KPICard'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorMessage } from '../components/ErrorMessage'
import { supabase } from '../lib/supabase'
import { safeNumberParse } from '../utils/dataConsistency'

interface OverviewStats {
  total_users: number
  pct_ge_50: number
  pct_ge_70: number
  pct_ge_80: number
}

export function Overview() {
  const [stats, setStats] = useState<OverviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOverviewStats = async () => {
    try {
      setLoading(true)
      setError(null)

      const query = `
        SELECT 
          COUNT(*)::int AS total_users,
          ROUND(100.0 * AVG((average >= 50)::int), 1) AS pct_ge_50,
          ROUND(100.0 * AVG((average >= 70)::int), 1) AS pct_ge_70,
          ROUND(100.0 * AVG((average >= 80)::int), 1) AS pct_ge_80
        FROM public.user_marks 
        WHERE average IS NOT NULL;
      `

      const { data, error } = await supabase
        .from('user_marks')
        .select('average')
        .not('average', 'is', null)

      if (error) throw error

      if (data) {
        const totalUsers = data.length
        // Improved precision calculation using safeNumberParse for boundary handling
        const studentsAvg50Plus = data.filter(row => safeNumberParse(row.average, 0) >= 50).length
        const studentsAvg70Plus = data.filter(row => safeNumberParse(row.average, 0) >= 70).length
        const studentsAvg80Plus = data.filter(row => safeNumberParse(row.average, 0) >= 80).length
        
        // Maintain precision to one decimal place for percentages
        const precisePct = (count: number, total: number): number => {
          const rawPct = total > 0 ? (count / total) * 100 : 0
          return Math.round(rawPct * 10) / 10  // One decimal place
        }
        
        const pctGe50 = precisePct(studentsAvg50Plus, totalUsers)
        const pctGe70 = precisePct(studentsAvg70Plus, totalUsers)
        const pctGe80 = precisePct(studentsAvg80Plus, totalUsers)

        setStats({
          total_users: totalUsers,
          pct_ge_50: pctGe50,
          pct_ge_70: pctGe70,
          pct_ge_80: pctGe80
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch overview stats')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOverviewStats()
  }, [])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} onRetry={fetchOverviewStats} />

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
        <p className="text-gray-600">Key performance indicators and student achievement metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Students"
          value={stats?.total_users || 0}
          subtitle="Active student records"
          icon={Users}
        />
        <KPICard
          title="Above 50% Average"
          value={`${stats?.pct_ge_50 || 0}%`}
          subtitle="Students achieving 50%+"
          icon={TrendingUp}
        />
        <KPICard
          title="Above 70% Average"
          value={`${stats?.pct_ge_70 || 0}%`}
          subtitle="Students achieving 70%+"
          icon={Award}
        />
        <KPICard
          title="Above 80% Average"
          value={`${stats?.pct_ge_80 || 0}%`}
          subtitle="Students achieving 80%+"
          icon={GraduationCap}
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Achievement Distribution</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-green-100 rounded-full w-24 h-24 mx-auto flex items-center justify-center mb-3">
              <span className="text-2xl font-bold text-green-700">{stats?.pct_ge_50 || 0}%</span>
            </div>
            <p className="text-sm font-medium text-gray-900">≥50% Achievement</p>
            <p className="text-xs text-gray-500">Basic proficiency</p>
          </div>
          <div className="text-center">
            <div className="bg-green-200 rounded-full w-24 h-24 mx-auto flex items-center justify-center mb-3">
              <span className="text-2xl font-bold text-green-800">{stats?.pct_ge_70 || 0}%</span>
            </div>
            <p className="text-sm font-medium text-gray-900">≥70% Achievement</p>
            <p className="text-xs text-gray-500">Good performance</p>
          </div>
          <div className="text-center">
            <div className="bg-green-300 rounded-full w-24 h-24 mx-auto flex items-center justify-center mb-3">
              <span className="text-2xl font-bold text-green-900">{stats?.pct_ge_80 || 0}%</span>
            </div>
            <p className="text-sm font-medium text-gray-900">≥80% Achievement</p>
            <p className="text-xs text-gray-500">Excellence</p>
          </div>
        </div>
      </div>
    </div>
  )
}