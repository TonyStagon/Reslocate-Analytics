import React, { useState, useEffect, useMemo } from 'react'
import { SearchableTable } from '../components/SearchableTable'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorMessage } from '../components/ErrorMessage'
import { supabase } from '../lib/supabase'
import { ChevronDown } from 'lucide-react'

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
  const [selectedUniversity, setSelectedUniversity] = useState<string>('all')
  const [selectedFaculty, setSelectedFaculty] = useState<string>('all')
  const [selectedAPS, setSelectedAPS] = useState<string>('all')

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

  const uniqueUniversities = useMemo(() => {
    const names = Array.from(new Set(universities.map(u => u.university_name)))
    return names.sort()
  }, [universities])

  const uniqueFaculties = useMemo(() => {
    const filtered = selectedUniversity === 'all'
      ? universities
      : universities.filter(u => u.university_name === selectedUniversity)
    const faculties = Array.from(new Set(filtered.map(u => u.faculty)))
    return faculties.sort()
  }, [universities, selectedUniversity])

  const apsRanges = [
    { label: 'All APS', value: 'all' },
    { label: '0-20', value: '0-20' },
    { label: '21-25', value: '21-25' },
    { label: '26-30', value: '26-30' },
    { label: '31+', value: '31+' },
  ]

  const filteredUniversities = useMemo(() => {
    return universities.filter(uni => {
      if (selectedUniversity !== 'all' && uni.university_name !== selectedUniversity) return false
      if (selectedFaculty !== 'all' && uni.faculty !== selectedFaculty) return false
      if (selectedAPS !== 'all') {
        const aps = uni.aps
        switch (selectedAPS) {
          case '0-20': return aps <= 20
          case '21-25': return aps >= 21 && aps <= 25
          case '26-30': return aps >= 26 && aps <= 30
          case '31+': return aps >= 31
          default: return true
        }
      }
      return true
    })
  }, [universities, selectedUniversity, selectedFaculty, selectedAPS])

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

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Programs</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              University
            </label>
            <div className="relative">
              <select
                value={selectedUniversity}
                onChange={(e) => {
                  setSelectedUniversity(e.target.value)
                  setSelectedFaculty('all')
                }}
                className="w-full appearance-none px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="all">All Universities</option>
                {uniqueUniversities.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Faculty
            </label>
            <div className="relative">
              <select
                value={selectedFaculty}
                onChange={(e) => setSelectedFaculty(e.target.value)}
                className="w-full appearance-none px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="all">All Faculties</option>
                {uniqueFaculties.map(faculty => (
                  <option key={faculty} value={faculty}>{faculty}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              APS Range
            </label>
            <div className="relative">
              <select
                value={selectedAPS}
                onChange={(e) => setSelectedAPS(e.target.value)}
                className="w-full appearance-none px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {apsRanges.map(range => (
                  <option key={range.value} value={range.value}>{range.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {(selectedUniversity !== 'all' || selectedFaculty !== 'all' || selectedAPS !== 'all') && (
          <button
            onClick={() => {
              setSelectedUniversity('all')
              setSelectedFaculty('all')
              setSelectedAPS('all')
            }}
            className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear all filters
          </button>
        )}
      </div>

      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <p className="text-sm text-gray-600">
          Showing <span className="font-semibold text-gray-900">{filteredUniversities.length}</span> of{' '}
          <span className="font-semibold text-gray-900">{universities.length}</span> programs
        </p>
      </div>

      <SearchableTable
        data={filteredUniversities}
        columns={columns}
        searchPlaceholder="Search qualifications..."
        exportFilename="universities"
      />
    </div>
  )
}