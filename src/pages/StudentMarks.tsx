import React, { useState, useEffect } from 'react'
import { User, BookOpen, Calculator, Globe, Award } from 'lucide-react'
import { SearchableTable } from '../components/SearchableTable'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorMessage } from '../components/ErrorMessage'
import { KPICard } from '../components/KPICard'
import { supabase } from '../lib/supabase'
import { formatNumericDisplay, safeNumberParse } from '../utils/dataConsistency'

interface StudentMark {
  user_id: string
  math_mark: number | null
  home_language_mark: number | null
  first_additional_language_mark: number | null
  second_additional_language_mark: number | null
  subject1: string | null
  subject1_mark: number | null
  subject2: string | null
  subject2_mark: number | null
  subject3: string | null
  subject3_mark: number | null
  subject4: string | null
  subject4_mark: number | null
  life_orientation_mark: number | null
  average: number | null
  math_level: number | null
  home_language_level: number | null
  first_additional_language_level: number | null
  second_additional_language_level: number | null
  subject1_level: number | null
  subject2_level: number | null
  subject3_level: number | null
  subject4_level: number | null
  aps_mark: number | null
  life_orientation_level: number | null
  math_type: string | null
  home_language: string | null
  first_additional_language: string | null
  second_additional_language: string | null
  profile_id: string | null
}

interface StudentStats {
  total_students: number
  avg_math_mark: number
  avg_home_language: number
  avg_aps: number
  high_achievers: number
}

export function StudentMarks() {
  const [students, setStudents] = useState<StudentMark[]>([])
  const [stats, setStats] = useState<StudentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStudentMarks = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch all student marks
      const { data: studentsData, error: studentsError } = await supabase
        .from('user_marks')
        .select('*')

      if (studentsError) throw studentsError

      // Client-side sorting for better control and consistency
      const sortedStudents = studentsData 
        ? studentsData.sort((a, b) => {        
            // Ensure valid number comparisons across platforms
            if (a.average === null && b.average === null) return 0
            if (a.average === null) return 1
            if (b.average === null) return -1
            const avgA = safeNumberParse(a.average, 0)
            const avgB = safeNumberParse(b.average, 0)
            return avgB - avgA
          })
        : []
      setStudents(sortedStudents)

      // Calculate statistics with proper precision handling
      if (studentsData && studentsData.length > 0) {
        // Use safeNumberParse for all numeric conversions
        const validMathMarks = studentsData
          .filter(s => s.math_mark !== null)
          .map(s => safeNumberParse(s.math_mark, 0))
        const validHomeLanguageMarks = studentsData
          .filter(s => s.home_language_mark !== null)
          .map(s => safeNumberParse(s.home_language_mark, 0))
        const validApsMarks = studentsData
          .filter(s => s.aps_mark !== null)
          .map(s => safeNumberParse(s.aps_mark, 0))
        
        // High achievers with precise average checking
        const highAchievers = studentsData
          .filter(s => {
            const avg = safeNumberParse(s.average, 0)
            return avg >= 80
          }).length

        // Maintain precision in calculations (no premature rounding)
        const rawAvgMath = validMathMarks.length > 0 
          ? validMathMarks.reduce((a, b) => a + b, 0) / validMathMarks.length 
          : 0
        const rawAvgHomeLang = validHomeLanguageMarks.length > 0 
          ? validHomeLanguageMarks.reduce((a, b) => a + b, 0) / validHomeLanguageMarks.length 
          : 0
        const rawAvgAps = validApsMarks.length > 0 
          ? validApsMarks.reduce((a, b) => a + b, 0) / validApsMarks.length 
          : 0

        setStats({
          total_students: studentsData.length,
          avg_math_mark: Math.round(rawAvgMath),  // Round only when storing for display
          avg_home_language: Math.round(rawAvgHomeLang),
          avg_aps: Math.round(rawAvgAps),  // APS must be integers
          high_achievers: highAchievers
        })
      } else {
        setStats({
          total_students: 0,
          avg_math_mark: 0,
          avg_home_language: 0,
          avg_aps: 0,
          high_achievers: 0
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch student marks')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudentMarks()
  }, [])

  const getPerformanceColor = (mark: number | null) => {
    if (!mark) return 'text-gray-400'
    if (mark >= 80) return 'text-green-600'
    if (mark >= 70) return 'text-blue-600'
    if (mark >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPerformanceBadge = (mark: number | null) => {
    if (!mark) return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-500">N/A</span>
    
    let bgColor = 'bg-red-100 text-red-800'
    if (mark >= 80) bgColor = 'bg-green-100 text-green-800'
    else if (mark >= 70) bgColor = 'bg-blue-100 text-blue-800'
    else if (mark >= 50) bgColor = 'bg-yellow-100 text-yellow-800'
    
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor}`}>
      {formatNumericDisplay(mark, 1, '%')}
    </span>
  }

  const columns = [
    { 
      key: 'user_id', 
      label: 'Student ID',
      render: (value: string) => (
        <div className="flex items-center">
          <User className="h-4 w-4 text-gray-400 mr-2" />
          <span className="font-mono text-xs">{value.slice(0, 8)}...</span>
        </div>
      )
    },
    { 
      key: 'average', 
      label: 'Average',
      render: (value: number | null) => getPerformanceBadge(value)
    },
    { 
      key: 'aps_mark', 
      label: 'APS Score',
      render: (value: number | null) => (
        <span className={`font-semibold ${getPerformanceColor(value)}`}>
          {value || 'N/A'}
        </span>
      )
    },
    { 
      key: 'math_mark', 
      label: 'Mathematics',
      render: (value: number | null, row: StudentMark) => (
        <div>
          {getPerformanceBadge(value)}
          {row.math_type && (
            <div className="text-xs text-gray-500 mt-1">{row.math_type}</div>
          )}
        </div>
      )
    },
    { 
      key: 'home_language_mark', 
      label: 'Home Language',
      render: (value: number | null, row: StudentMark) => (
        <div>
          {getPerformanceBadge(value)}
          {row.home_language && (
            <div className="text-xs text-gray-500 mt-1">{row.home_language}</div>
          )}
        </div>
      )
    },
    { 
      key: 'first_additional_language_mark', 
      label: 'First Add. Lang',
      render: (value: number | null, row: StudentMark) => (
        <div>
          {getPerformanceBadge(value)}
          {row.first_additional_language && (
            <div className="text-xs text-gray-500 mt-1">{row.first_additional_language}</div>
          )}
        </div>
      )
    },
    { 
      key: 'subject1_mark', 
      label: 'Subject 1',
      render: (value: number | null, row: StudentMark) => (
        <div>
          {getPerformanceBadge(value)}
          {row.subject1 && (
            <div className="text-xs text-gray-500 mt-1">{row.subject1}</div>
          )}
        </div>
      )
    },
    { 
      key: 'subject2_mark', 
      label: 'Subject 2',
      render: (value: number | null, row: StudentMark) => (
        <div>
          {getPerformanceBadge(value)}
          {row.subject2 && (
            <div className="text-xs text-gray-500 mt-1">{row.subject2}</div>
          )}
        </div>
      )
    },
    { 
      key: 'life_orientation_mark', 
      label: 'Life Orientation',
      render: (value: number | null) => getPerformanceBadge(value)
    },
  ]

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} onRetry={fetchStudentMarks} />

  // Calculate Life Orientation average on the fly with precision
  const validLifeOrientationMarks = students.filter(s => s.life_orientation_mark !== null)
  const lifeOrientationAvg = validLifeOrientationMarks.length > 0
    ? validLifeOrientationMarks.reduce((sum, s) => sum + safeNumberParse(s.life_orientation_mark, 0), 0) / validLifeOrientationMarks.length
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Academic Records</h1>
        <p className="text-gray-600">Comprehensive view of student performance across all subjects</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Students"
          value={stats?.total_students || 0}
          subtitle="Academic records"
          icon={User}
        />
        <KPICard
          title="Avg Mathematics"
          value={`${stats?.avg_math_mark || 0}%`}
          subtitle="Mathematics performance"
          icon={Calculator}
        />
        <KPICard
          title="Avg Home Language"
          value={`${stats?.avg_home_language || 0}%`}
          subtitle="Language proficiency"
          icon={Globe}
        />
        <KPICard
          title="High Achievers"
          value={stats?.high_achievers || 0}
          subtitle="Students with 80%+ average"
          icon={Award}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <BookOpen className="h-5 w-5 mr-2 text-green-600" />
            Subject Performance Distribution
          </h2>
          <div className="space-y-4">
            {[
              { subject: 'Mathematics', rawAvg: stats?.avg_math_mark || 0 },
              { subject: 'Home Language', rawAvg: stats?.avg_home_language || 0 },
              { subject: 'Life Orientation', rawAvg: lifeOrientationAvg },
            ].map((item) => {
              // Round for display while preserving raw calculations
              const displayAvg = Math.round(item.rawAvg)
              return (
                <div key={item.subject} className="flex items-center space-x-4">
                  <div className="w-32 text-sm font-medium text-gray-700">{item.subject}</div>
                  <div className="flex-1">
                    <div className="bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${
                          displayAvg >= 80 ? 'bg-green-500' :
                          displayAvg >= 70 ? 'bg-blue-500' :
                          displayAvg >= 50 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(displayAvg, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-12 text-sm font-semibold text-gray-700 text-right">
                    {displayAvg}%
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Award className="h-5 w-5 mr-2 text-green-600" />
            APS Score Distribution
          </h2>
          <div className="space-y-3">
            {[
              { range: '40+ (Excellent)', min: 40, color: 'bg-green-500' },
              { range: '35-39 (Very Good)', min: 35, max: 39, color: 'bg-blue-500' },
              { range: '30-34 (Good)', min: 30, max: 33.5, color: 'bg-yellow-500' }, // Fixed non-integer boundary
              { range: '25-29 (Fair)', min: 25, max: 29, color: 'bg-orange-500' },
              { range: '20-24 (Poor)', min: 20, max: 24, color: 'bg-red-500' },
              { range: '<20 (Very Poor)', max: 19, color: 'bg-gray-500' },
            ].map((bucket) => {
              const count = students.filter(s => {
                if (!s.aps_mark) return false
                const aps = safeNumberParse(s.aps_mark, 0)
                if (bucket.min && bucket.max && bucket.max === 33.5)
                  return aps >= bucket.min && aps <= 34  // Handle the -34 range specially
                if (bucket.min && bucket.max) 
                  return aps >= bucket.min && aps <= bucket.max
                if (bucket.min) 
                  return aps >= bucket.min
                if (bucket.max) 
                  return aps <= bucket.max
                return false
              }).length
              
              const percentage = students.length > 0 ? (count / students.length) * 100 : 0
              const displayPercentage = Math.round(percentage * 10) / 10  // One decimal place for clarity
              
              return (
                <div key={bucket.range} className="flex items-center space-x-4">
                  <div className="w-32 text-xs font-medium text-gray-700">{bucket.range}</div>
                  <div className="flex-1">
                    <div className="bg-gray-200 rounded-full h-4">
                      <div
                        className={`h-4 rounded-full transition-all duration-500 ${bucket.color}`}
                        style={{ width: `${displayPercentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-12 text-xs font-semibold text-gray-700 text-right">{count}</div>
                </div>
              )
            })}
          </div>
        </div>   
      </div>

      <SearchableTable
        data={students}
        columns={columns}
        searchPlaceholder="Search by student ID, subject, or language..."
        exportFilename="student_marks"
      />
    </div>
  )
}