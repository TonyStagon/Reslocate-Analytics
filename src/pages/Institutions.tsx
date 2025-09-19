import React, { useState, useEffect } from 'react'
import { ExternalLink, MapPin } from 'lucide-react'
import { SearchableTable } from '../components/SearchableTable'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorMessage } from '../components/ErrorMessage'
import { supabase } from '../lib/supabase'

interface Institution {
  institution_name: string
  province: string
  city: string
  website: string
}

export function Institutions() {
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInstitutions = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('Institutions Information')
        .select('title, province, city, website')
        .order('province')
        .order('title')

      if (error) throw error

      const formattedData = (data || []).map(item => ({
        institution_name: item.title,
        province: item.province,
        city: item.city,
        website: item.website
      }))

      setInstitutions(formattedData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch institutions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInstitutions()
  }, [])

  const columns = [
    { key: 'institution_name', label: 'Institution Name' },
    { 
      key: 'province', 
      label: 'Province',
      render: (value: string) => (
        <div className="flex items-center">
          <MapPin className="h-4 w-4 text-gray-400 mr-1" />
          {value || 'N/A'}
        </div>
      )
    },
    { key: 'city', label: 'City' },
    { 
      key: 'website', 
      label: 'Website',
      sortable: false,
      render: (value: string) => value ? (
        <a
          href={value.startsWith('http') ? value : `https://${value}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-green-600 hover:text-green-700 transition-colors"
        >
          Visit <ExternalLink className="h-3 w-3 ml-1" />
        </a>
      ) : (
        <span className="text-gray-400">No website</span>
      )
    },
  ]

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} onRetry={fetchInstitutions} />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Educational Institutions</h1>
        <p className="text-gray-600">Directory of educational institutions with contact information</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Institutions</h3>
          <p className="text-3xl font-bold text-green-600">{institutions.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Provinces Covered</h3>
          <p className="text-3xl font-bold text-green-600">
            {new Set(institutions.map(i => i.province).filter(Boolean)).size}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">With Websites</h3>
          <p className="text-3xl font-bold text-green-600">
            {institutions.filter(i => i.website).length}
          </p>
        </div>
      </div>

      <SearchableTable
        data={institutions}
        columns={columns}
        searchPlaceholder="Search institutions, provinces, or cities..."
        exportFilename="institutions"
      />
    </div>
  )
}