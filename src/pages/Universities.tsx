import React, { useState, useEffect } from 'react'
import { SearchableTable } from '../components/SearchableTable'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorMessage } from '../components/ErrorMessage'
import { supabase } from '../lib/supabase'

interface University {
  qualification: string
  aps: number
  faculty: string
  university_name: string
  id: number
}

export function Universities() {
  const [universities, setUniversities] = useState<University[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUniversities = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('universities')
        .select('qualification, aps, faculty, university_name, id')
        .not('qualification', 'is', null)
        .order('university_name')
        .order('faculty')
        .order('qualification')

      if (error) throw error
      setUniversities(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch universities')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUniversities()
  }, [])

  const columns = [
    { key: 'university_name', label: 'University' },
    { key: 'faculty', label: 'Faculty' },
    { key: 'qualification', label: 'Qualification' },
    { 
      key: 'aps', 
      label: 'APS Required',
      render: (value: number) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value >= 30 ? 'bg-red-100 text-red-800' :
          value >= 25 ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          {value || 'N/A'}
        </span>
      )
    },
  ]

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} onRetry={fetchUniversities} />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">University Programs</h1>
        <p className="text-gray-600">Browse available qualifications, faculties, and APS requirements</p>
      </div>

      <SearchableTable
        data={universities}
        columns={columns}
        searchPlaceholder="Search universities, faculties, or qualifications..."
        exportFilename="universities"
      />
    </div>
  )
}