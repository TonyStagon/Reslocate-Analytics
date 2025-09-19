import React, { useState, useEffect } from 'react'
import { SearchableTable } from '../components/SearchableTable'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorMessage } from '../components/ErrorMessage'
import { supabase } from '../lib/supabase'

interface TVETCollege {
  qualification: string
  aps: number
  faculty: string
  tvet_college_name: string
  id: number
}

export function TVET() {
  const [colleges, setColleges] = useState<TVETCollege[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTVETColleges = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('tvet_colleges_name')
        .select('qualification, aps, faculty, tvet_college_name, id')
        .not('qualification', 'is', null)
        .order('tvet_college_name')
        .order('faculty')
        .order('qualification')

      if (error) throw error
      setColleges(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch TVET colleges')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTVETColleges()
  }, [])

  const columns = [
    { key: 'tvet_college_name', label: 'TVET College' },
    { key: 'faculty', label: 'Faculty' },
    { key: 'qualification', label: 'Qualification' },
    { 
      key: 'aps', 
      label: 'APS Required',
      render: (value: number) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value >= 25 ? 'bg-red-100 text-red-800' :
          value >= 20 ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          {value || 'N/A'}
        </span>
      )
    },
  ]

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} onRetry={fetchTVETColleges} />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">TVET College Programs</h1>
        <p className="text-gray-600">Explore technical and vocational education opportunities</p>
      </div>

      <SearchableTable
        data={colleges}
        columns={columns}
        searchPlaceholder="Search TVET colleges, faculties, or qualifications..."
        exportFilename="tvet_colleges"
      />
    </div>
  )
}