import React, { useState, useEffect } from 'react'
import { BarChart3, Users } from 'lucide-react'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorMessage } from '../components/ErrorMessage'
import { supabase } from '../lib/supabase'

interface MatchData {
  institution_name: string
  matches: number
  pct_of_matched: number
}

interface UniqueStudentData {
  institution_name: string
  students_matched: number
  pct_of_students_matched: number
}

export function Matches() {
  const [matchData, setMatchData] = useState<MatchData[]>([])
  const [uniqueStudentData, setUniqueStudentData] = useState<UniqueStudentData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewType, setViewType] = useState<'matches' | 'students'>('matches')

  const fetchMatchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch match distribution data
      const { data: matchesData, error: matchesError } = await supabase
        .from('student_university_matches')
        .select('institution_name')

      if (matchesError) throw matchesError

      // Process matches data
      const matchCounts = matchesData?.reduce((acc, match) => {
        acc[match.institution_name] = (acc[match.institution_name] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}

      const totalMatches = Object.values(matchCounts).reduce((sum, count) => sum + count, 0)

      const processedMatchData = Object.entries(matchCounts)
        .map(([institution_name, matches]) => ({
          institution_name,
          matches,
          pct_of_matched: Math.round((matches / totalMatches) * 100 * 10) / 10
        }))
        .sort((a, b) => b.matches - a.matches)

      setMatchData(processedMatchData)

      // Fetch unique students data
      const { data: studentsData, error: studentsError } = await supabase
        .from('student_university_matches')
        .select('institution_name, student_id')

      if (studentsError) throw studentsError

      // Process unique students data
      const uniqueStudentCounts = studentsData?.reduce((acc, match) => {
        if (!acc[match.institution_name]) {
          acc[match.institution_name] = new Set()
        }
        acc[match.institution_name].add(match.student_id)
        return acc
      }, {} as Record<string, Set<string>>) || {}

      const totalUniqueStudents = new Set(studentsData?.map(m => m.student_id)).size

      const processedStudentData = Object.entries(uniqueStudentCounts)
        .map(([institution_name, studentsSet]) => ({
          institution_name,
          students_matched: studentsSet.size,
          pct_of_students_matched: Math.round((studentsSet.size / totalUniqueStudents) * 100 * 10) / 10
        }))
        .sort((a, b) => b.students_matched - a.students_matched)

      setUniqueStudentData(processedStudentData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch match data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMatchData()
  }, [])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} onRetry={fetchMatchData} />

  const currentData = viewType === 'matches' ? matchData : uniqueStudentData
  const maxValue = Math.max(...currentData.map(d => 
    viewType === 'matches' ? d.matches : (d as UniqueStudentData).students_matched
  ))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Student-University Matches</h1>
        <p className="text-gray-600">Analysis of student matching patterns across institutions</p>
      </div>

      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setViewType('matches')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            viewType === 'matches'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <BarChart3 className="inline-block w-4 h-4 mr-2" />
          Total Matches
        </button>
        <button
          onClick={() => setViewType('students')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            viewType === 'students'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Users className="inline-block w-4 h-4 mr-2" />
          Unique Students
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          {viewType === 'matches' ? 'Match Distribution' : 'Student Distribution'} by Institution
        </h2>
        
        <div className="space-y-4">
          {currentData.slice(0, 15).map((item, index) => {
            const value = viewType === 'matches' ? item.matches : (item as UniqueStudentData).students_matched
            const percentage = viewType === 'matches' ? item.pct_of_matched : (item as UniqueStudentData).pct_of_students_matched
            const barWidth = (value / maxValue) * 100

            return (
              <div key={item.institution_name} className="flex items-center space-x-4">
                <div className="w-4 text-sm text-gray-500 font-medium">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.institution_name}
                    </p>
                    <div className="flex items-center space-x-3 text-sm">
                      <span className="text-gray-600">{value}</span>
                      <span className="text-green-600 font-medium">{percentage}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {currentData.length > 15 && (
          <p className="text-sm text-gray-500 mt-4 text-center">
            Showing top 15 of {currentData.length} institutions
          </p>
        )}
      </div>
    </div>
  )
}